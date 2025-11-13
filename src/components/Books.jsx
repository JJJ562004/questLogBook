import { Bone, BoxGeometry, Uint16BufferAttribute, Skeleton, SkinnedMesh, Vector3, Float32BufferAttribute, Color, MeshStandardMaterial, SRGBColorSpace, MathUtils, CanvasTexture} from "three"
import {pages, pageAtom, FAKE_PAGE} from "./UI"
import { useEffect, useMemo, useRef } from "react"
//import { SkeletonHelper } from "three/src/Three.Core.js";
import { useFrame } from "@react-three/fiber";
import { useCursor, useTexture } from "@react-three/drei";
import { useAtom } from "jotai";
import { degToRad } from "three/src/math/MathUtils.js";
import { easing } from "maath";
import { useState } from "react";
import { data } from "autoprefixer";

const easingFactor = 0.5; //Control the speed of the easing
const easingFactorFold = 0.3; // Control the speed of the fold easing
const insideCurveStrength = 0.18; // Control the intensity of the inside curve bend
const outsideCurveStrength = 0.01; // Control the intensity of the outside curve bend
const turningCurveStrength = 0.09; // Control the intensity of the turning curve bend

// 4:3 aspect ratio
const PAGE_WIDTH = 1.3;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENT = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENT;

const pageGeometry = new BoxGeometry(
    PAGE_WIDTH,
    PAGE_HEIGHT,
    PAGE_DEPTH,
    PAGE_SEGMENT,
    2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0); // move the geometry so that the left edge is at the origin

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
    //ALL VERTICES
    vertex.fromBufferAttribute(position, i); // get the vertex at position i
    const x = vertex.x; // get the x position of the vertex

    const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH)); // calculate skin index based on segment
    let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH; // calculate skin weight based on position within segment

    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0); // push skin index (4 values per vertex, 4 bones)
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0); // push skin weight (4 values per vertex, 4 bones)
}

pageGeometry.setAttribute(
    "skinIndex",
    new Uint16BufferAttribute(skinIndexes, 4)
);

pageGeometry.setAttribute(
    "skinWeight",
    new Float32BufferAttribute(skinWeights, 4)
); // We use float32 because the weights are between 0 and 1

const whiteColor = new Color("white");
const emisiveColor = new Color("orange");

const pageMaterials = [
    new MeshStandardMaterial({ color: whiteColor }),
    new MeshStandardMaterial({ color: "#111" }),
    new MeshStandardMaterial({ color: whiteColor }),
    new MeshStandardMaterial({ color: whiteColor }),
];
pages.forEach((page) => {
    useTexture.preload(`/textures/${page.front}.jpg`);
    useTexture.preload(`/textures/${page.back}.jpg`);
    useTexture.preload(`/textures/book-cover-roughness.jpg`);
});

// createStudentTexture unchanged but safe
function createStudentTexture(baseTexture, student){
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1024;
  canvas.height = 1024;

  // Draw base texture if available
  if (baseTexture && baseTexture.image) {
    // some textures use an HTMLImageElement, some use canvas; draw if available
    try {
      ctx.drawImage(baseTexture.image, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      // fallback if image not ready or cross-origin
      ctx.fillStyle = "#fff8e7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.fillStyle = "#fff8e7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Text overlay
  ctx.fillStyle = "rgba(30, 30, 30, 0.95)";
  ctx.font = "bold 64px Serif";
  ctx.textAlign = "center";
  ctx.fillText(student?.name ?? "No Name", canvas.width / 2, 300);

  ctx.font = "48px Serif";
  ctx.fillText(`Age: ${student?.age ?? "-"}`, canvas.width / 2, 460);
  ctx.fillText(`Major: ${student?.grade ?? "-"}`, canvas.width / 2, 560);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}




// const Page = ({number, front, back, page, opened, bookClosed, student, ...props}) => {
//     const [picture, picture2, pictureRoughness] = useTexture([
//         `/textures/${front}.jpg`,
//         `/textures/${back}.jpg`,
//         ...(number === 0 || number === pages.length -1
//             ? [`/textures/old-texture-roughness.jpg`]
//             : []),
//     ]) 
//     picture.colorSpace = picture2.colorSpace = SRGBColorSpace; //use colorSpace to ensure correct color space

//     const group = useRef();
//     const turnedAt = useRef(0);
//     const lastOpened = useRef(opened);

//     const skinnedMeshRef = useRef();

//     const manualSkinnedMesh = useMemo(() => {
//         const bones = [];
//         for (let i = 0; i <= PAGE_SEGMENT; i++) {
//             let bone = new Bone();
//             bones.push(bone);
//             if (i === 0) {
//                 bone.position.x = 0;                
//             }
//             else{
//                 bone.position.x = SEGMENT_WIDTH;
//             }
//             if (i > 0) {
//                 bones[i - 1].add(bone); // attach new bone to previous bone
//             }
//         }

//         const skeleton = new Skeleton(bones);

//         // Generate finalTexture (either a CanvasTexture overlay or the original picture)
//         // If student exists, create canvas-based texture with text on top of base picture.
//         let finalTexture = picture;
//         let createdTexture = null;
//         if (student) {
//             createdTexture = createStudentTexture(picture, student);
//             finalTexture = createdTexture;
//         }
        
//         const materials = [...pageMaterials,
//             new MeshStandardMaterial({
//                 color: whiteColor,
//                 map: finalTexture, // <-- use finalTexture here (was picture before)
//                 ...(number === 0
//                     ? {
//                         roughnessMap: pictureRoughness,     
//                     }
//                     : {
//                         roughness: 0.1,
//                     }),
//                     emissive: emisiveColor,
//                     emissiveIntensity: 0,
//             }),
//             new MeshStandardMaterial({
//                 color: whiteColor,
//                 map: picture2,
//                 ...(number === pages.length -1
//                     ? {
//                         roughnessMap: pictureRoughness,
//                     }
//                     : {
//                         roughness: 0.1,
//                     }),
//                     emissive: emisiveColor,
//                     emissiveIntensity: 0,
//             }),
//         ];
//         const mesh = new SkinnedMesh(pageGeometry, materials);
//         mesh.castShadow = true;
//         mesh.receiveShadow = true;
//         mesh.frustumCulled = false;
//         mesh.add(skeleton.bones[0]);
//         mesh.bind(skeleton);
//         // attach created texture to mesh so we can dispose it in cleanup
//         mesh.userData._createdTexture = createdTexture;

//         return mesh;
//     }, [picture, picture2, pictureRoughness, student, number]);

    
//     //useHelper(SkinnedMesh, SkeletonHelper, "red"); // visualize skeleton to help with debugging

//     useFrame((_, delta) => {
//         if (!skinnedMeshRef.current) {return;}

//         const emissiveIntensity = highlighted ? 0.22 : 0;
//         skinnedMeshRef.current.material[4].emissiveIntensity = //front page
//             skinnedMeshRef.current.material[5].emissiveIntensity = // back page
//                 MathUtils.lerp(
//                     skinnedMeshRef.current.material[4].emissiveIntensity,
//                     emissiveIntensity,
//                     0.1
//                 );

//         if (lastOpened.current !== opened){
//             turnedAt.current = + new Date();
//             lastOpened.current = opened;
//         }

//         let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
//         turningTime = Math.sin(turningTime * Math.PI);

//         let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
//         if (!bookClosed){
//             targetRotation += degToRad(number * 0.8); // slight offset for each page
//         }

//         const bones = skinnedMeshRef.current.skeleton.bones;
//         for (let i = 0; i < bones.length; i++) {
//             const target = i === 0 ? group.current : bones[i];

//             const insideCurveIntensity = i < 8 ? Math.sin(i*0.05+0.5) : 0;
//             const outsideCurveIntensity = i >= 8 ? Math.cos(i*0.2+0.5) : 0;
//             const turningCurveIntensity = 
//                 Math.sin(i * Math.PI * (1/bones.length)) * turningTime;
            
//             let rotationAngle = 
//                 insideCurveStrength * insideCurveIntensity * targetRotation
//                 + outsideCurveStrength * outsideCurveIntensity * targetRotation
//                 + turningCurveStrength * turningCurveIntensity * targetRotation;
//                 let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
//             if (bookClosed){
//                 if (i === 0){
//                     rotationAngle = targetRotation;
//                     foldRotationAngle = 0;
//                 }else{
//                     rotationAngle = 0;
//                 }
//             }
//             easing.dampAngle(
//                 target.rotation, 
//                 "y", 
//                 rotationAngle, 
//                 easingFactor, 
//                 delta,
//             );

//             const foldIntensity = 
//                 i > 8
//                     ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
//                     : 0;
//             easing.dampAngle(
//                 target.rotation, 
//                 "x", 
//                 foldRotationAngle * foldIntensity,
//                 easingFactorFold, 
//                 delta,
//             );
//         }
//     });

//     const [_, setPage] = useAtom(pageAtom);
//     const [highlighted, setHighLighted] = useState(false);
//     useCursor(highlighted);

//     return (
//         <group {...props} ref ={group}
//             onPointerEnter={(e) => {
//                 e.stopPropagation();
//                 setHighLighted(true);
//             }}
//             onPointerLeave={(e) => {
//                 e.stopPropagation();
//                 setHighLighted(false);
//             }}
//             onClick={(e) => {
//                 e.stopPropagation();
//                 if (bookClosed && number === 0){
//                     setPage(FAKE_PAGE);
//                 } else{
//                     setPage(opened ? number : number + 1);
//                 }                
//                 setHighLighted(false);
//             }}
//         >
//             <primitive 
//                 object={manualSkinnedMesh} 
//                 ref={skinnedMeshRef} 
//                 position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
//             />
//         </group>
//     );
// };
const Page = ({ number, front, back, page, opened, bookClosed, student, ...props }) => {
    const [picture, picture2, pictureRoughness] = useTexture([
        `/textures/${front}.jpg`,
        `/textures/${back}.jpg`,
        ...(number === 0 || number === pages.length - 1
            ? [`/textures/old-texture-roughness.jpg`]
            : []),
    ]);
    picture.colorSpace = picture2.colorSpace = SRGBColorSpace; // use colorSpace to ensure correct color space

    const group = useRef();
    const turnedAt = useRef(0);
    const lastOpened = useRef(opened);

    const skinnedMeshRef = useRef();

    const manualSkinnedMesh = useMemo(() => {
        const bones = [];
        for (let i = 0; i <= PAGE_SEGMENT; i++) {
            let bone = new Bone();
            bones.push(bone);
            if (i === 0) {
                bone.position.x = 0;
            } else {
                bone.position.x = SEGMENT_WIDTH;
            }
            if (i > 0) {
                bones[i - 1].add(bone); // attach new bone to previous bone
            }
        }

        const skeleton = new Skeleton(bones);

        // Only create a student texture for real pages
        let finalTexture = picture;
        let createdTexture = null;
        if (number >= FAKE_PAGE && number < pages.length - FAKE_PAGE) {
            if (student) {
                createdTexture = createStudentTexture(picture, student);
                finalTexture = createdTexture;
            }
        }

        const materials = [
            ...pageMaterials,
            new MeshStandardMaterial({
                color: whiteColor,
                map: finalTexture, // Use finalTexture here
                ...(number === 0
                    ? {
                          roughnessMap: pictureRoughness,
                      }
                    : {
                          roughness: 0.1,
                      }),
                emissive: emisiveColor,
                emissiveIntensity: 0,
            }),
            new MeshStandardMaterial({
                color: whiteColor,
                map: picture2,
                ...(number === pages.length - 1
                    ? {
                          roughnessMap: pictureRoughness,
                      }
                    : {
                          roughness: 0.1,
                      }),
                emissive: emisiveColor,
                emissiveIntensity: 0,
            }),
        ];
        const mesh = new SkinnedMesh(pageGeometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        mesh.add(skeleton.bones[0]);
        mesh.bind(skeleton);
        // Attach created texture to mesh so we can dispose it in cleanup
        mesh.userData._createdTexture = createdTexture;

        return mesh;
    }, [picture, picture2, pictureRoughness, student, number]);

    useFrame((_, delta) => {
        if (!skinnedMeshRef.current) {
            return;
        }

        const emissiveIntensity = highlighted ? 0.22 : 0;
        skinnedMeshRef.current.material[4].emissiveIntensity = // front page
            skinnedMeshRef.current.material[5].emissiveIntensity = // back page
                MathUtils.lerp(
                    skinnedMeshRef.current.material[4].emissiveIntensity,
                    emissiveIntensity,
                    0.1
                );

        if (lastOpened.current !== opened) {
            turnedAt.current = +new Date();
            lastOpened.current = opened;
        }

        let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
        turningTime = Math.sin(turningTime * Math.PI);

        let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
        if (!bookClosed) {
            targetRotation += degToRad(number * 0.8); // slight offset for each page
        }

        const bones = skinnedMeshRef.current.skeleton.bones;
        for (let i = 0; i < bones.length; i++) {
            const target = i === 0 ? group.current : bones[i];

            const insideCurveIntensity = i < 8 ? Math.sin(i * 0.05 + 0.5) : 0;
            const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.2 + 0.5) : 0;
            const turningCurveIntensity =
                Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;

            let rotationAngle =
                insideCurveStrength * insideCurveIntensity * targetRotation +
                outsideCurveStrength * outsideCurveIntensity * targetRotation +
                turningCurveStrength * turningCurveIntensity * targetRotation;
            let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
            if (bookClosed) {
                if (i === 0) {
                    rotationAngle = targetRotation;
                    foldRotationAngle = 0;
                } else {
                    rotationAngle = 0;
                }
            }
            easing.dampAngle(
                target.rotation,
                "y",
                rotationAngle,
                easingFactor,
                delta
            );

            const foldIntensity =
                i > 8
                    ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) *
                      turningTime
                    : 0;
            easing.dampAngle(
                target.rotation,
                "x",
                foldRotationAngle * foldIntensity,
                easingFactorFold,
                delta
            );
        }
    });

    const [_, setPage] = useAtom(pageAtom);
    const [highlighted, setHighLighted] = useState(false);
    useCursor(highlighted);

    return (
        <group
            {...props}
            ref={group}
            onPointerEnter={(e) => {
                e.stopPropagation();
                setHighLighted(true);
            }}
            onPointerLeave={(e) => {
                e.stopPropagation();
                setHighLighted(false);
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (bookClosed && number === 0) {
                    setPage(FAKE_PAGE);
                } else {
                    setPage(opened ? number : number + 1);
                }
                setHighLighted(false);
            }}
        >
            <primitive
                object={manualSkinnedMesh}
                ref={skinnedMeshRef}
                position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
            />
        </group>
    );
};
export const Books = (...props) => {
    const [page] = useAtom(pageAtom);
    const [delayedPage, setDelayedPage] = useState(page);
    const [students, setStudents] = useState([]);

    //Fetch student data from FastAPI
    useEffect(() => {
        fetch("http://127.0.0.1:8000/students")
        .then((res) => res.json())
        .then((data) => setStudents(data))
        .catch((err) => console.error("Error fetching students:", err));
    }, []);

    useEffect(() => {
        let timeout;
        const goToPage =() => {
            setDelayedPage((delayedPage) => {
                if (page === delayedPage) {
                    return delayedPage;
                } else{
                    timeout = setTimeout(
                        () => {
                            goToPage();
                        },
                        Math.abs(page - delayedPage) > 2 ? 50 : 150
                    );
                    if (page > delayedPage){
                        return delayedPage + 1;
                    }
                    if (page < delayedPage){
                        return delayedPage - 1;
                    }
                }
            });
        };
        goToPage();
        return () => clearTimeout(timeout);

    }, [page]);

    return (
    <group {...props} rotation-y={-Math.PI / 2}>
        {[...pages].map((pageData, index) => 
                (<Page 
                    key={index} 
                    page={delayedPage}                    
                    number={index} 
                    opened={delayedPage > index}
                    bookClosed={delayedPage === 0 || delayedPage === pages.length}
                    //student={students[index] ?? {name: "Loading...", age:"", grade: ""}}
                    {...pageData}
                />
        ))}
    </group>
    );
};
