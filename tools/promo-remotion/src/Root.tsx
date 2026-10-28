import { Composition } from "remotion";
import { Promo, FPS } from "./Promo";
import vo from "../public/vo.json";
import { PromoV2, DURATION2, FPS2 } from "./PromoV2";

export const Root: React.FC = () => (
  <>
  <Composition id="PromoV2" component={PromoV2} durationInFrames={DURATION2} fps={FPS2} width={1080} height={1920} defaultProps={{ voice: true }} />
  <Composition id="Promo" component={Promo} durationInFrames={Math.ceil(vo.duration * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
