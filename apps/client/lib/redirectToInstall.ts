export const redirectToInstallation = () => {
    if (typeof window !== 'undefined') {
      const url = process.env.NEXT_PUBLIC_INSTALLATION_URL;
      if (url) {
        window.location.href = url;
      } else {
        console.error('Installation URL is not defined.');
      }
    }
  };
  