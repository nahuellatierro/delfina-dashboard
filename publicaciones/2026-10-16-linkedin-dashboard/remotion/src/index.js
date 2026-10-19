import { registerRoot, Composition } from "remotion";
import React from "react";
import { Video, DURACION } from "./Video";

const Root = () => (
  <Composition
    id="DashboardDelfina"
    component={Video}
    durationInFrames={DURACION}
    fps={30}
    width={1080}
    height={1350}
  />
);

registerRoot(Root);
