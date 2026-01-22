import React from "react";
import { Composition, registerRoot } from "remotion";
import { PolydraftHype } from "./compositions/PolydraftHype";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PolydraftHype"
        component={PolydraftHype}
        durationInFrames={610} // ~20 seconds at 30fps
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

registerRoot(RemotionRoot);
