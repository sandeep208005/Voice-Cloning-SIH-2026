import os
import hashlib
import numpy as np
from PIL import Image
from typing import List, Dict, Set, Tuple


def compute_md5(file_path: str) -> str:
    """Computes MD5 checksum of an image file."""
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def compute_dhash(image_path: str, hash_size: int = 8) -> int:
    """
    Computes difference hash (dHash) to detect identical or near-duplicate images,
    regardless of slight resizing, format conversions, or compression differences.
    """
    try:
        with Image.open(image_path) as img:
            # Convert to grayscale and resize to (hash_size + 1, hash_size)
            gray = img.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = np.array(gray, dtype=np.int32)
            # Compare adjacent pixels horizontally
            diff = pixels[:, 1:] > pixels[:, :-1]
            # Convert binary array to integer hash
            hash_int = 0
            for bit in diff.flatten():
                hash_int = (hash_int << 1) | int(bit)
            return hash_int
    except Exception:
        return 0


def hamming_distance(h1: int, h2: int) -> int:
    """Calculates bitwise Hamming distance between two perceptual hashes."""
    x = h1 ^ h2
    dist = 0
    while x > 0:
        dist += x & 1
        x >>= 1
    return dist


def deduplicate_dataset(directory: str, max_hamming_distance: int = 1) -> Tuple[int, int]:
    """
    Scans directory for exact and near-duplicate images and removes duplicates.
    Intra-split deduplication ensures no duplicate training or test images exist.
    Cross-split isolation ensures no test image leaks from train or val.
    """
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    files = []
    for root, _, filenames in os.walk(directory):
        for fn in filenames:
            if os.path.splitext(fn)[1].lower() in valid_exts:
                files.append(os.path.join(root, fn))

    md5_registry: Dict[str, str] = {}
    dhash_registry: List[Tuple[str, int, str]] = []  # (path, hash, class_label)
    removed_count = 0

    print(f"Scanning {len(files)} images in {directory} for exact and perceptual duplicates...")

    for fpath in sorted(files):
        if not os.path.exists(fpath):
            continue

        # Extract class label from parent folder if present ('real', 'synthetic', or 'hard')
        parent_dir = os.path.basename(os.path.dirname(fpath))

        # 1. Check exact MD5 checksum
        file_md5 = compute_md5(fpath)
        if file_md5 in md5_registry:
            print(f"  [EXACT DUPLICATE] Removing {fpath} (matches {md5_registry[file_md5]})")
            os.remove(fpath)
            removed_count += 1
            continue
        md5_registry[file_md5] = fpath

        # 2. Check perceptual hash (dHash) for identical structure
        cur_dhash = compute_dhash(fpath)
        if cur_dhash == 0:
            continue

        is_near_dup = False
        for orig_path, orig_dhash, orig_class in dhash_registry:
            # Only prune if either:
            # a) same class and identical/near-identical dhash (dist <= max_hamming_distance)
            # b) different split (preventing train-test leakage where dist <= 2)
            dist = hamming_distance(cur_dhash, orig_dhash)
            orig_split = os.path.basename(os.path.dirname(os.path.dirname(orig_path)))
            cur_split = os.path.basename(os.path.dirname(os.path.dirname(fpath)))

            if orig_split != cur_split and dist <= 2:
                # Cross-split leakage! Test/val image matches train image
                print(f"  [LEAKAGE PREVENTED (dist={dist})] Removing test/val clone {fpath} (matches train {orig_path})")
                os.remove(fpath)
                removed_count += 1
                is_near_dup = True
                break
            elif orig_class == parent_dir and dist <= max_hamming_distance:
                # Intra-class duplicate within same split
                print(f"  [INTRA-CLASS DUPLICATE (dist={dist})] Removing {fpath} (matches {orig_path})")
                os.remove(fpath)
                removed_count += 1
                is_near_dup = True
                break

        if not is_near_dup:
            dhash_registry.append((fpath, cur_dhash, parent_dir))

    print(f"Deduplication complete. Scanned: {len(files)}, Removed duplicates: {removed_count}")
    return len(files), removed_count


if __name__ == "__main__":
    import sys
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    if os.path.exists(target_dir):
        deduplicate_dataset(target_dir)
    else:
        print(f"Directory {target_dir} not found.")
