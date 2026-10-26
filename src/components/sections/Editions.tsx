import Image from "next/image";
import type { Dict } from "@/lib/dictionaries/pt";
import { photos } from "@/lib/site";
import { H2, container, section } from "../ui";

const images = [
  photos.editions.manaus,
  photos.editions.cartagena,
  photos.editions.oaxaca,
  photos.editions.rio,
  photos.editions.medellin,
];

export default function Editions({ t }: { t: Dict["editions"] }) {
  return (
    <section id="edicoes" className={`${section} scroll-mt-20`} aria-labelledby="edicoes-title">
      <div className={container}>
        <H2 id="edicoes-title" className="max-w-xl" >
          <span data-reveal className="block">{t.title}</span>
        </H2>
        <ul className="mt-14 grid grid-flow-dense grid-cols-2 gap-3 md:mt-20 lg:grid-cols-12 lg:grid-rows-[repeat(2,minmax(15rem,1fr))] lg:gap-4">
          {t.list.map((e, i) => (
            <li
              key={e.year}
              data-reveal
              className={i === 0 ? "col-span-2 lg:col-span-6 lg:row-span-2" : "lg:col-span-3"}
            >
              <div className="h-full rounded-[2rem] bg-ink/[0.04] p-1.5 ring-1 ring-line">
                <figure
                  className={`group relative h-full overflow-hidden rounded-[calc(2rem-6px)] bg-block ${
                    i === 0 ? "min-h-[24rem]" : "min-h-[14rem]"
                  }`}
                >
                  <div data-img-scale className="absolute inset-0">
                    <Image
                      src={images[i]}
                      alt=""
                      fill
                      sizes={i === 0 ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 25vw, 50vw"}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(34_14_52/0.88))]" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
                    <p className={`font-display leading-tight ${i === 0 ? "text-4xl md:text-5xl" : "text-xl md:text-2xl"}`}>
                      {e.city}
                    </p>
                    <p className="mt-1 text-sm text-white/80">{e.year}</p>
                  </figcaption>
                </figure>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
