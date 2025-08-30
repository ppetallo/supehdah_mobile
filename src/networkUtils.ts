// import NetInfo from '@react-native-community/netinfo';
// import { API } from './api';

// /**
//  * Checks if the device is connected to the internet
//  */
// export const checkInternetConnection = async (): Promise<boolean> => {
//   const state = await NetInfo.fetch();
//   return state.isConnected === true;
// };

// /**
//  * Tests the connection to the backend server
//  * @returns An object with status (true/false) and a message
//  */
// export const testServerConnection = async (): Promise<{success: boolean; message: string}> => {
//   try {
//     // First check if device has internet
//     const hasInternet = await checkInternetConnection();
//     if (!hasInternet) {
//       return { 
//         success: false, 
//         message: "No internet connection. Please check your network settings."
//       };
//     }

//     // Try to reach the server
//     const startTime = Date.now();
//     await API.get('/ping', { timeout: 5000 });
//     const endTime = Date.now();
    
//     return {
//       success: true,
//       message: `Server is online. Response time: ${endTime - startTime}ms`
//     };
//   } catch (error) {
//     console.error('Server connection test failed:', error);
    
//     // If we get here, we have internet but server connection failed
//     return {
//       success: false,
//       message: "Server is unreachable. Please check the server URL in the API configuration."
//     };
//   }
// };

// /**
// //  * Gets the current base URL from the API configuration
//  */
// export const getServerUrl = (): string => {
//   return API.defaults.baseURL || '';
// };
