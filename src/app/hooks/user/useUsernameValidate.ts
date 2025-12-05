export function useUsernameValidate() {
  //   Check username format
  //   9-25 characters
  //   Letters and numbers only
  //   Starts with a letter
  //   No spaces, emojis, or symbols
  const usernameFormatCheck = (username: string) => {
    if (!username) {
      return 'Username is required';
    }
    if (username.length < 9 || username.length > 25) {
      return `9-25 characters`;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return `Letters and numbers only`;
    }
    if (!/^[a-zA-Z]/.test(username)) {
      return `Starts with a letter`;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return `No spaces, emojis, or symbols`;
    }
    return false;
  };

  return {
    usernameFormatCheck,
  };
}
