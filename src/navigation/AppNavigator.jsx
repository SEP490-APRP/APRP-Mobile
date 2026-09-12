import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ─── Auth ────────────────────────────────────────────────────────────────────
import SplashScreen from "../screens/auth/SplashScreen";
// import LoginScreen from "../screens/auth/LoginScreen";
// import RegisterScreen from "../screens/auth/RegisterScreen";
// import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
// import OAuthRegisterScreen from "../screens/auth/OAuthRegisterScreen";

// ─── Buyer ───────────────────────────────────────────────────────────────────
import HomeScreen from "../screens/buyer/HomeScreen";
// import ProductsScreen from "../screens/buyer/ProductsScreen";
// import ProductDetailScreen from "../screens/buyer/ProductDetailScreen";
// import CartScreen from "../screens/buyer/CartScreen";
// import CheckoutScreen from "../screens/buyer/CheckoutScreen";
// import OrderHistoryScreen from "../screens/buyer/OrderHistoryScreen";
// import OrderDetailScreen from "../screens/buyer/OrderDetailScreen";
// import OrderTrackingScreen from "../screens/buyer/OrderTrackingScreen";
// import AccountScreen from "../screens/buyer/AccountScreen";
// import ProfileEditScreen from "../screens/buyer/ProfileEditScreen";
// import ShopInfoScreen from "../screens/buyer/ShopInfoScreen";
// import ShopVouchersScreen from "../screens/buyer/ShopVouchersScreen";
// import VoucherWalletScreen from "../screens/buyer/VoucherWalletScreen";
// import BuyerWalletScreen from "../screens/buyer/BuyerWalletScreen";
// import NewsScreen from "../screens/buyer/NewsScreen";
// import NewsDetailScreen from "../screens/buyer/NewsDetailScreen";
// import MysteryBoxListScreen from "../screens/buyer/MysteryBoxListScreen";
// import MysteryBoxDetailScreen from "../screens/buyer/MysteryBoxDetailScreen";
// import PaymentResultScreen from "../screens/buyer/PaymentResultScreen";
// import PayOSWebViewScreen from "../screens/buyer/PayOSWebViewScreen";
// import CodSuccessScreen from "../screens/buyer/CodSuccessScreen";

// ─── Shared ──────────────────────────────────────────────────────────────────
// import ChatInboxScreen from "../screens/shared/ChatInboxScreen";
// import ChatDetailScreen from "../screens/shared/ChatDetailScreen";
// import ChatBotScreen from "../screens/shared/ChatBotScreen";

// ─── Shop Owner ──────────────────────────────────────────────────────────────
// Tabs
// import OrderTab from "../screens/shopOwner/tabs/OrderTab";
// import NotificationTab from "../screens/shopOwner/tabs/NotificationTab";
// import ManageTab from "../screens/shopOwner/tabs/ManageTab";
// Pages
// import DashboardScreen from "../screens/shopOwner/pages/DashboardScreen";
// import ProductListScreen from "../screens/shopOwner/pages/ProductListScreen";
// import AddProductScreen from "../screens/shopOwner/pages/AddProductScreen";
// import EditProductScreen from "../screens/shopOwner/pages/EditProductScreen";
// import AddMysteryBoxScreen from "../screens/shopOwner/pages/AddMysteryBoxScreen";
// import ProfileScreen_ShopOwner from "../screens/shopOwner/pages/ProfileScreen";
// import EditProfileScreen from "../screens/shopOwner/pages/EditProfileScreen";
// import WalletScreen_ShopOwner from "../screens/shopOwner/pages/WalletScreen";
// import VoucherScreen from "../screens/shopOwner/pages/VoucherScreen";
// import ReviewScreen from "../screens/shopOwner/pages/ReviewScreen";
// import ChatAdminScreen from "../screens/shopOwner/pages/ChatAdminScreen";
// import CustomerChatScreen from "../screens/shopOwner/pages/CustomerChatScreen";

// ─── Shipper ─────────────────────────────────────────────────────────────────
// import ShipperDeliveryMapScreen from "../screens/shipper/ShipperDeliveryMapScreen";
// Tabs
// import NewOrderTab from "../screens/shipper/tabs/NewOrderTab";
// import DeliveringTab from "../screens/shipper/tabs/DeliveringTab";
// import NotificationTab_Shipper from "../screens/shipper/tabs/NotificationTab";
// import PersonalTab from "../screens/shipper/tabs/PersonalTab";
// Pages
// import ProfileScreen_Shipper from "../screens/shipper/pages/ProfileScreen";
// import SettingsScreen from "../screens/shipper/pages/SettingsScreen";
// import EarningsScreen from "../screens/shipper/pages/EarningsScreen";
// import WalletScreen_Shipper from "../screens/shipper/pages/WalletScreen";
// import VerificationScreen from "../screens/shipper/pages/VerificationScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Entry point — swap SplashScreen → auth flow when ready */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home"   component={HomeScreen} />

        {/* ── Uncomment screens below as you implement them ─────────────── */}

        {/* AUTH */}
        {/* <Stack.Screen name="Login"           component={LoginScreen} /> */}
        {/* <Stack.Screen name="Register"        component={RegisterScreen} /> */}
        {/* <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} /> */}
        {/* <Stack.Screen name="OAuthRegister"   component={OAuthRegisterScreen} /> */}

        {/* BUYER */}
        {/* <Stack.Screen name="Products"        component={ProductsScreen} /> */}
        {/* <Stack.Screen name="ProductDetail"   component={ProductDetailScreen} /> */}
        {/* <Stack.Screen name="Cart"            component={CartScreen} /> */}
        {/* <Stack.Screen name="Checkout"        component={CheckoutScreen} /> */}
        {/* <Stack.Screen name="OrderHistory"    component={OrderHistoryScreen} /> */}
        {/* <Stack.Screen name="OrderDetail"     component={OrderDetailScreen} /> */}
        {/* <Stack.Screen name="OrderTracking"   component={OrderTrackingScreen} /> */}
        {/* <Stack.Screen name="Account"         component={AccountScreen} /> */}
        {/* <Stack.Screen name="ProfileEdit"     component={ProfileEditScreen} /> */}
        {/* <Stack.Screen name="ShopInfo"        component={ShopInfoScreen} /> */}
        {/* <Stack.Screen name="ShopVouchers"    component={ShopVouchersScreen} /> */}
        {/* <Stack.Screen name="VoucherWallet"   component={VoucherWalletScreen} /> */}
        {/* <Stack.Screen name="BuyerWallet"     component={BuyerWalletScreen} /> */}
        {/* <Stack.Screen name="News"            component={NewsScreen} /> */}
        {/* <Stack.Screen name="NewsDetail"      component={NewsDetailScreen} /> */}
        {/* <Stack.Screen name="MysteryBoxList"  component={MysteryBoxListScreen} /> */}
        {/* <Stack.Screen name="MysteryBoxDetail" component={MysteryBoxDetailScreen} /> */}
        {/* <Stack.Screen name="PaymentResult"   component={PaymentResultScreen} /> */}
        {/* <Stack.Screen name="PayOSWebView"    component={PayOSWebViewScreen} /> */}
        {/* <Stack.Screen name="CodSuccess"      component={CodSuccessScreen} /> */}

        {/* SHARED */}
        {/* <Stack.Screen name="ChatInbox"       component={ChatInboxScreen} /> */}
        {/* <Stack.Screen name="ChatDetail"      component={ChatDetailScreen} /> */}
        {/* <Stack.Screen name="ChatBot"         component={ChatBotScreen} /> */}

        {/* SHOP OWNER */}
        {/* <Stack.Screen name="ShopOwnerDashboard"      component={DashboardScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerProductList"    component={ProductListScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerAddProduct"     component={AddProductScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerEditProduct"    component={EditProductScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerAddMysteryBox"  component={AddMysteryBoxScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerProfile"        component={ProfileScreen_ShopOwner} /> */}
        {/* <Stack.Screen name="ShopOwnerEditProfile"    component={EditProfileScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerWallet"         component={WalletScreen_ShopOwner} /> */}
        {/* <Stack.Screen name="ShopOwnerVoucher"        component={VoucherScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerReview"         component={ReviewScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerChatAdmin"      component={ChatAdminScreen} /> */}
        {/* <Stack.Screen name="ShopOwnerCustomerChat"   component={CustomerChatScreen} /> */}

        {/* SHIPPER */}
        {/* <Stack.Screen name="ShipperDeliveryMap"  component={ShipperDeliveryMapScreen} /> */}
        {/* <Stack.Screen name="ShipperProfile"      component={ProfileScreen_Shipper} /> */}
        {/* <Stack.Screen name="ShipperSettings"     component={SettingsScreen} /> */}
        {/* <Stack.Screen name="ShipperEarnings"     component={EarningsScreen} /> */}
        {/* <Stack.Screen name="ShipperWallet"       component={WalletScreen_Shipper} /> */}
        {/* <Stack.Screen name="ShipperVerification" component={VerificationScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
