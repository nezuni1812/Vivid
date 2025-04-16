import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TikTokCallback: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (accessToken) {
      console.log('Access token received:', accessToken);
      localStorage.setItem('tiktok_access_token', accessToken);
      window.location.href = '/tiktok-stats';
    } else if (error) {
      window.location.href = '/tiktok-login?error=' + encodeURIComponent(error);
    }
  }, [location]);

  return <div>Loading...</div>;
};

export default TikTokCallback;