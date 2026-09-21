# DeepShield AI — Security Policy & Controls

As a cybersecurity platform engineered to detect sophisticated impersonation attacks, DeepShield AI treats application security, cryptographic integrity, and data privacy as first-class operational requirements.

---

## 1. Threat Model & Security Controls

### 1.1 Ingestion & File Upload Security
- **Strict Magic-Byte MIME Validation**: DeepShield never relies solely on client-reported Content-Type headers or file extensions. The first bytes of every file are inspected against byte signatures (e.g. `RIFF...WAVE`, `\x89PNG`, `ftypisom`, `fLaC`, `ID3`). Text, executable binaries (`MZ`), scripts (`<html`, `<?php`), and ZIP archives spoofed as media files are rejected.
- **Path Traversal Prevention**: Filenames are sanitized and immediately mapped to internal cryptographic UUIDs (`uuid.uuid4()`). User-controlled paths are never concatenated directly into filesystem operations.
- **Payload Quotas**: Strict file size limit of 100MB enforced in streaming chunks to mitigate denial-of-service (DoS) memory exhaustion.
- **Safe Temporary Storage**: Uploads reside in an isolated storage directory with directory listing disabled and no executable permissions.

### 1.2 Cryptographic Authentication
- **Password Hashing**: Passwords are never stored in plaintext. DeepShield enforces NIST and OWASP-compliant `PBKDF2-HMAC-SHA256` with 600,000 iterations and unique 16-byte random salts.
- **Signed Session Tokens**: Stateless authentication utilizes HMAC-SHA256 signed JSON Web Tokens (JWT) with configured expiration windows.
- **Defense in Depth**: Database queries utilize SQLAlchemy 2.0 parameterized statements, mitigating SQL injection vulnerabilities.

### 1.3 Privacy & Data Retention
- **Sanitization & Erasure**: Users have the right to purge any recorded analysis. When an analysis is deleted via `DELETE /analyses/{id}`, both the database record and associated physical files (including generated spectrogram heatmaps) are permanently deleted from disk.
- **Zero Third-Party Exfiltration**: Ingested biometrics are processed strictly on the local inference engine and are never silently sent to third-party APIs.
- **Error Obfuscation**: Production exceptions are caught and sanitized. Internal stack traces and server environment variables are never exposed to clients.

---

## 2. Vulnerability Reporting

If you discover a security vulnerability within DeepShield AI, please send an encrypted report to:
`security@deepshield.ai`

Include:
1. Target endpoint and vulnerability classification (e.g. CWE-434, CWE-22).
2. Proof of concept (PoC) or reproduction steps.
3. Impact assessment.
