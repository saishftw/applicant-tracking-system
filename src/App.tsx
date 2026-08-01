import { AppShell } from "@/components/shell/AppShell";
import { useAppStore } from "@/store/useAppStore";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { JDSetupScreen } from "@/screens/JDSetupScreen";
import { ShortlistScreen } from "@/screens/ShortlistScreen";
import { SwipeScreen } from "@/screens/SwipeScreen";
import { CandidatesScreen } from "@/screens/CandidatesScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";

export default function App() {
  const screen = useAppStore((s) => s.activeScreen);
  return (
    <AppShell>
      {screen === "dashboard" && <DashboardScreen />}
      {screen === "jd" && <JDSetupScreen />}
      {screen === "shortlist" && <ShortlistScreen />}
      {screen === "swipe" && <SwipeScreen />}
      {screen === "candidates" && <CandidatesScreen />}
      {screen === "profile" && <ProfileScreen />}
    </AppShell>
  );
}

