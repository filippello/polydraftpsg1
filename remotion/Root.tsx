import React from "react";
import { Composition, registerRoot } from "remotion";
import { PolydraftHype } from "./compositions/PolydraftHype";
import { BetShareCard } from "./compositions/BetShareCard";
import { ExploreDemo } from "./compositions/ExploreDemo";

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
      <Composition
        id="BetShareCard"
        component={BetShareCard}
        durationInFrames={1}
        fps={30}
        width={1200}
        height={630}
        defaultProps={{
          outcome: "JD Vance",
          probability: 0.25,
          direction: "yes" as const,
          market: "Presidential Election 2028",
          amount: 5,
        }}
      />
      <Composition
        id="ExploreDemo"
        component={ExploreDemo}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

registerRoot(RemotionRoot);
