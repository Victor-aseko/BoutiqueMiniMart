import React from 'react';
import * as WebBrowser from 'expo-web-browser';

export const useWarmUpBrowser = () => {
    React.useEffect(() => {
        // Warm up the android browser to improve performance
        // https://docs.expo.dev/guides/authentication/#improving-performance
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};
