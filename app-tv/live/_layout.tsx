import { Stack } from 'expo-router';

export default function LiveLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
