/**
 * Hidden index route - redirects to inbox
 * This ensures that navigating to /(tabs) or /(tabs)/ goes to inbox
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/inbox" />;
}
