"use client";

/**
 * Decides whether the persistent YumbieWorkspace renders for the current route
 * and which room (scene) it shows. The workspace survives navigation (module
 * memory replays the door walk), so Yumbie passes through the door between rooms.
 */
import { usePathname } from "next/navigation";
import { YumbieWorkspace } from "./YumbieWorkspace";
import { YumbieDataBridge } from "./YumbieDataBridge";
import { YumbieInsight } from "./YumbieInsight";
import { YumbieDeeplink } from "./YumbieDeeplink";
import { isWorkspaceAllowed, pathToScene } from "./scenes";

export function YumbieWorkspaceGate() {
  const pathname = usePathname() ?? "";
  if (!isWorkspaceAllowed(pathname)) return null;
  const scene = pathToScene(pathname);
  return (
    <>
      <YumbieDataBridge />
      <YumbieWorkspace sceneId={scene} />
      <YumbieInsight />
      <YumbieDeeplink />
    </>
  );
}
