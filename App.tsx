import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RegisterScreen from "./src/screens/RegisterScreen";
import TourScreen from "./src/screens/TourScreen";
import TourMapScreen from "./src/screens/TourMapScreen";
import LoginScreen from "./src/screens/LoginScreen";
import TourFormScreen from "./src/screens/TourFormScreen";
import EditStopsScreen from "./src/screens/EditStopsScreen";
import StopFormScreen from "./src/screens/StopFormScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tours: undefined;
  MapaDetallado: { tourId: string; tourTitle: string };
  TourForm: { tourId?: string }; // Para create/edit tour
  EditStops: { tourId: string };
  StopForm: { tourId: string; stopId?: string }; // Para create/edit stop
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Tours" component={TourScreen} />
        <Stack.Screen name="MapaDetallado" component={TourMapScreen} />
        <Stack.Screen name="TourForm" component={TourFormScreen} />
        <Stack.Screen name="EditStops" component={EditStopsScreen} />
        <Stack.Screen name="StopForm" component={StopFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
