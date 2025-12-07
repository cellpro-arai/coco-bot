import { useEffect, useState } from 'react';
import { getUserInfo } from '../services/apiService';

export function useUserInfo() {
  const [userName, setUserName] = useState('');
  const [isNameEditable, setIsNameEditable] = useState(true);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserInfo = async () => {
      try {
        const userInfo = await getUserInfo();
        if (!isMounted) {
          return;
        }

        if (userInfo && userInfo.name) {
          setUserName(userInfo.name);
          setIsNameEditable(false);
        } else {
          setIsNameEditable(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error('ユーザー情報の取得に失敗しました:', error);
          setIsNameEditable(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUserInfo(false);
        }
      }
    };

    fetchUserInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    userName,
    isNameEditable,
    isLoadingUserInfo,
  };
}
