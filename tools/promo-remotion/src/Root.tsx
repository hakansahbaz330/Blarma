import { Composition } from "remotion";
import { Promo, FPS } from "./Promo";
import vo from "../public/vo.json";

export const Root: React.FC = () => (
  <Composition id="Promo" component={Promo} durationInFrames={Math.ceil(vo.duration * FPS)} fps={FPS} width={1080} height={1920} />
);
