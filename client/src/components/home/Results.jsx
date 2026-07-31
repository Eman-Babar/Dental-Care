import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const RESULTS = [
  {
    title: "Clearer alignment",
    caption: "Orthodontic care for a confident bite",
    before:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=900&q=80",
    after:
      "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Brighter smile",
    caption: "Professional whitening with lasting shine",
    before:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80",
    after:
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Healthy gums",
    caption: "Gentle cleaning and restorative care",
    before:
      "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=900&q=80",
    after:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80",
  },
];

function Results() {
  return (
    <section className="section-pad bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
              See the difference
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Real treatment journeys — from first visit to a healthier, brighter
              smile.
            </p>
          </div>
          <Link to="/appointment" className="btn-primary self-start md:self-auto">
            Book your visit
          </Link>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {RESULTS.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="overflow-hidden border border-[var(--line)] bg-[var(--paper)]"
            >
              <div className="grid grid-cols-2 gap-px bg-[var(--line)]">
                <div className="relative aspect-[4/5] bg-[var(--surface)]">
                  <img
                    src={item.before}
                    alt={`${item.title} — before treatment`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 bg-[var(--brand-deep)]/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Before
                  </span>
                </div>
                <div className="relative aspect-[4/5] bg-[var(--surface)]">
                  <img
                    src={item.after}
                    alt={`${item.title} — after treatment`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 bg-[var(--brand)]/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    After
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.caption}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Results;
