export function getAvatarLetters(name: string): string {
    if (!name) return 'US';
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const parts = cleanName.split(' ');
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    if (cleanName.length >= 2) {
      return cleanName.substring(0, 2).toUpperCase();
    }
    
    return cleanName.toUpperCase();
  }