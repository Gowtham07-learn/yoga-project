// Levels data with reference images and guessed reference angles
export const LEVELS = [
  {
    id: 1,
    name: "Tree Pose (Vrksāsana)",
    image: "https://cdn.yogajournal.com/wp-content/uploads/2022/01/Tree-Pose_Alt-1_2400x1350_Andrew-Clark.jpeg",
    desc: "Stand on one leg; keep torso upright; hands overhead.",
    angles: { LShoulder: 50, RShoulder: 50, LElbow: 170, RElbow: 170, LHip: 180, RHip: 170, LKnee: 175, RKnee: 15 },
    tolerances: { LShoulder:35, RShoulder:35, LElbow:30, RElbow:30, LHip:30, RHip:35, LKnee:25, RKnee:40},
    weights: { LShoulder:1, RShoulder:1, LElbow:1, RElbow:1, LHip:1, RHip:1, LKnee:1, RKnee:1}
  },
  {
    id: 2,
    name: "Warrior II (Virabhadrāsana II)",
    image: "https://cdn.yogajournal.com/wp-content/uploads/2021/12/Warrior-2-Pose_Andrew-Clark_2400x1350.jpeg",
    desc: "Wide stance; front knee ~90°; arms extended horizontally.",
    angles: { LShoulder: 90, RShoulder: 90, LElbow: 170, RElbow:170, LHip:120, RHip:170, LKnee:90, RKnee:175 },
    tolerances: { LShoulder:25, RShoulder:25, LElbow:30, RElbow:30, LHip:30, RHip:40, LKnee:25, RKnee:35},
    weights: { LShoulder:1.2, RShoulder:1.2, LElbow:1, RElbow:1, LHip:1, RHip:1, LKnee:1.4, RKnee:1}
  },
  {
    id: 3,
    name: "Downward-Facing Dog (Adho Mukha Śvānāsana)",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/57/Downward-Facing-Dog.JPG",
    desc: "Upside-V: hips high, spine long.",
    angles: { LShoulder: 50, RShoulder:50, LElbow:170, RElbow:170, LHip:90, RHip:90, LKnee:170, RKnee:170 },
    tolerances: { LShoulder:35, RShoulder:35, LElbow:30, RElbow:30, LHip:40, RHip:40, LKnee:30, RKnee:30},
    weights: { LShoulder:1, RShoulder:1, LElbow:1, RElbow:1, LHip:1.3, RHip:1.3, LKnee:0.8, RKnee:0.8}
  },
  {
    id: 4,
    name: "Chair Pose (Utkatasana)",
    image: "https://cdn.yogajournal.com/wp-content/uploads/2021/11/Chair-Pose_Andrew-Clark.jpg",
    desc: "Knees bent as if sitting; torso lifted; arms overhead.",
    angles: { LShoulder: 60, RShoulder:60, LElbow:165, RElbow:165, LHip:100, RHip:100, LKnee:100, RKnee:100 },
    tolerances: { LShoulder:30, RShoulder:30, LElbow:35, RElbow:35, LHip:25, RHip:25, LKnee:25, RKnee:25},
    weights: { LShoulder:1, RShoulder:1, LElbow:0.8, RElbow:0.8, LHip:1.4, RHip:1.4, LKnee:1.6, RKnee:1.6}
  },
  {
    id: 5,
    name: "Cobra Pose (Bhujangāsana)",
    image: "https://omstars.com/blog/wp-content/uploads/2024/11/how-to-do-cobra-pose.png",
    desc: "Prone back-bend: chest lifted, gentle spine arch.",
    angles: { LShoulder: 40, RShoulder:40, LElbow:140, RElbow:140, LHip:150, RHip:150, LKnee:170, RKnee:170 },
    tolerances: { LShoulder:30, RShoulder:30, LElbow:40, RElbow:40, LHip:30, RHip:30, LKnee:35, RKnee:35},
    weights: { LShoulder:1, RShoulder:1, LElbow:1.2, RElbow:1.2, LHip:1.4, RHip:1.4, LKnee:0.8, RKnee:0.8}
  }
];