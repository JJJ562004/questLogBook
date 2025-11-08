import { atom, useAtom } from "jotai";
import { useEffect } from "react";

export const FAKE_PAGE = 21
const pictures = Array(100).fill('book-page') //100 to make the book thicker

export const pageAtom = atom(0);
export const pages = [
  {
    front: "book-front-cover",
    back: pictures[0],
  },
];
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

pages.push({
  front: pictures[pictures.length - 1],
  back: "book-back-cover",
});

//filter out fake items and reasign indexes
const realPages = pages.slice(FAKE_PAGE, pages.length - FAKE_PAGE);
const displayPages = [
  pages[0],
  ...realPages,
  pages[pages.length-1]
]

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);

  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]);

  return (
    <>
<main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col">
        <a className="pointer-events-auto mt-10 ml-10" href="">
          <img className="w-20" src="/images/quest_logo.jpg" />
        </a>
        <div className="w-full overflow-auto pointer-events-auto flex justify-center">
          <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
            {displayPages.map((_, index) => (
              <button
                key={index}
                className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                  page === (index === 0
                    ? 0 // Cover
                    : index === displayPages.length - 1
                    ? pages.length // Back Cover
                    : index + FAKE_PAGE - 1) // Map displayPages index to pages index
                    ? "bg-white/90 text-black"
                    : "bg-black/30 text-white"
                }`}
                onClick={() => {
                  const actualPageIndex =
                    index === 0
                      ? 0 // Cover
                      : index === displayPages.length - 1
                      ? pages.length // Back Cover
                      : index + FAKE_PAGE - 1; // Map displayPages index to pages index
                  setPage(actualPageIndex);
                }}
              >
                {index === 0
                  ? "Cover"
                  : index === displayPages.length - 1
                  ? "Back Cover"
                  : `Page ${index}`}
              </button>
            ))}
          </div>
        </div>
      </main>

      <div className="fixed inset-0 flex items-center -rotate-2 select-none hidden">
        <div className="relative">
          <div className="bg-white/0  animate-horizontal-scroll flex items-center gap-8 w-max px-8">
            <h1 className="shrink-0 text-white text-10xl font-black ">
              It's me JJJ
            </h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">
              React Three Fiber
            </h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">
              Three.js
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              Ultimate Guide
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-medium">
              Tutorials
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-extralight italic">
              Learn
            </h2>
            <h2 className="shrink-0 text-white text-13xl font-bold">
              Practice
            </h2>
            <h2 className="shrink-0 text-transparent text-13xl font-bold outline-text italic">
              Creative
            </h2>
          </div>
          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-8 px-8 w-max">
            <h1 className="shrink-0 text-white text-10xl font-black ">
              It's me JJJ
            </h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">
              React Three Fiber
            </h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">
              Three.js
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              Ultimate Guide
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-medium">
              Tutorials
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-extralight italic">
              Learn
            </h2>
            <h2 className="shrink-0 text-white text-13xl font-bold">
              Practice
            </h2>
            <h2 className="shrink-0 text-transparent text-13xl font-bold outline-text italic">
              Creative
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};
