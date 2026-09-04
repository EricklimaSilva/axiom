import { navigate } from "./router.js";
import { initializeSidebar } from "./components/Sidebar.js";

async function startApplication() {
    navigate("welcome");
    initializeSidebar();
}

startApplication();
lucide.createIcons();