import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TikTokCallback: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('access_token');
    const error = params.get('error');
  
    if (window.opener) {
      window.opener.postMessage(
        { accessToken, error },
        window.location.origin
      );
  
      window.close();
    } else {
      if (accessToken) {
        localStorage.setItem('tiktok_access_token', accessToken);
        window.location.href = '/homepage';
      } else if (error) {
        window.location.href = '/homepage?error=' + encodeURIComponent(error);
      }
    }
  }, [location]);  

  return <div>Loading...</div>;
};

export default TikTokCallback;