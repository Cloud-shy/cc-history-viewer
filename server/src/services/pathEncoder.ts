// Claude Code encodes Windows paths for directory names by replacing
// backslashes and colons with dashes. e.g.:
//   C:\Users\Administrator\Desktop  ->  C--Users-Administrator-Desktop

export function encodePath(realPath: string): string {
  return realPath.replace(/\\/g, '-').replace(/:/g, '-');
}

export function decodePath(encoded: string): string {
  // Reconstruct the Windows path from the encoded form.
  // The pattern is: drive letter + -- + rest (with - as path separator)
  // e.g. "C--Users-Administrator-Desktop" -> "C:\Users\Administrator\Desktop"

  // Handle both "C--" and "c--" prefixes
  const match = encoded.match(/^([a-zA-Z])--(.+)$/);
  if (!match) {
    return encoded.replace(/-/g, '\\');
  }

  const drive = match[1].toUpperCase();
  const rest = match[2].replace(/-/g, '\\');
  return `${drive}:\\${rest}`;
}

export function getShortName(encoded: string): string {
  // Decode to Windows path and take the basename
  const decoded = decodePath(encoded);
  const parts = decoded.split('\\').filter(Boolean);
  return parts[parts.length - 1] || decoded;
}
