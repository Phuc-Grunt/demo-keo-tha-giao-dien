import { Play } from "lucide-react";

interface PlayBtnProps { size?: number }

/** Hiển thị biểu tượng phát trên ảnh đại diện video. */
const PlayBtn = ({ size = 32 }: PlayBtnProps) => (
  <div className="vplay-btn" style={{ width: size + 20, height: size + 20 }}>
    <Play size={size} fill="white" strokeWidth={0} />
  </div>
);

export default PlayBtn;
