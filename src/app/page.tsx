import { getWeeklyMeals, getTodaySchedule, getGroceryList, getRawInventory } from "@/lib/data";
import { Utensils } from "lucide-react";
import MealSwapModal from "@/components/MealSwapModal";
import { getSmartMealImage } from "@/lib/mealImages";
import { getFamilyPhotos } from "@/lib/drivePhotos";
import FamilyPhotoFrame from "@/components/FamilyPhotoFrame";

export const revalidate = 1800; // 30 minutes ISR caching

// Cook coding — ONLY system colors: gold = Dad, emerald = Mom, neutral = Both/Family
function cookMeta(cook?: string) {
  const c = (cook || "Both").toLowerCase();
  if (c === "dad") return { cls: "cook dad", label: "Dad" };
  if (c === "mom") return { cls: "cook mom", label: "Mom" };
  if (c === "family") return { cls: "cook both", label: "Family" };
  return { cls: "cook both", label: "Both" };
}

// Filtering by Dad/Mom must always include shared (Both/Family) meals.
function cookMatchesFilter(cook: string | undefined, filter: string) {
  if (filter === "all") return true;
  const c = (cook || "Both").toLowerCase();
  const shared = c === "both" || c === "family";
  if (filter === "dad") return c === "dad" || shared;
  if (filter === "mom") return c === "mom" || shared;
  if (filter === "both") return shared;
  return true;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ cook?: string }> }) {
  const params = await searchParams;
  const cookFilter = params.cook || "all";

  const allMeals = await getWeeklyMeals();
  const schedule = await getTodaySchedule();
  const groceryItems = await getGroceryList();
  const rawInventory = await getRawInventory();
  const familyPhotos = await getFamilyPhotos();

  const daysCount = 7; // Rolling 7-day view

  const days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayNameShort = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

    const targetDateStr =
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

    const dayMeals = allMeals.filter((m) => {
      if (!m.date || m.date === "Unknown Date") return false;
      const normalizedDateStr = m.date.replace(/-/g, "/");
      const mDate = new Date(normalizedDateStr);
      return mDate.getDate() === d.getDate() && mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear();
    });

    const lunch = dayMeals.find((m) => (m.type || "").toLowerCase() === "lunch") || null;
    const dinner = dayMeals.find((m) => (m.type || "Dinner").toLowerCase() === "dinner") || null;

    return { index: i, dayNameShort, dayNum, monthShort, lunch, dinner, isToday: i === 0, targetDateStr };
  });

  const filteredDays =
    cookFilter === "all"
      ? days
      : days.filter(
          (d) =>
            (d.dinner && cookMatchesFilter(d.dinner.cook, cookFilter)) ||
            (d.lunch && cookMatchesFilter(d.lunch.cook, cookFilter))
        );

  const todaysDinner = days[0].dinner;
  const tomorrowsDinner = days.length > 1 ? days[1].dinner : null;
  const todaysLunch = days[0].lunch;

  const toBuyCount = groceryItems.filter((i) => i.status === "To Buy").length;
  const restockCount = groceryItems.filter((i) => i.status === "Restock").length;

  // Grocery preview — real item names, not a lone number.
  const previewSource = (toBuyCount > 0 ? groceryItems.filter((i) => i.status === "To Buy") : groceryItems);
  const previewNames = previewSource.slice(0, 6).map((i) => i.ingredient);
  const previewRemaining = previewSource.length - previewNames.length;
  const groceryPreview =
    previewNames.join(" · ") + (previewRemaining > 0 ? ` · +${previewRemaining} more` : "");

  // Week filter segmented control
  const filterOpts = [
    { key: "all", label: "All" },
    { key: "dad", label: "Dad" },
    { key: "mom", label: "Mom" },
    { key: "both", label: "Both" },
  ];

  const weekCap = `${days[0].monthShort} ${days[0].dayNum} – ${days[6].monthShort} ${days[6].dayNum}`;

  return (
    <div className="dashboard-container">
      {/* ===== HERO BAND (Mock B: Tonight card + 2 minis + Memories) ===== */}
      <section className="hero-row">
        {/* TONIGHT (dinner hero + lunch row) */}
        <article className="widget tonight">
          {todaysDinner && todaysDinner.name !== "No meal scheduled" ? (
            <>
              <div className="tonight-body">
                <div className="ovl-row">
                  <span className="ovl">Tonight&rsquo;s Dinner</span>
                  {todaysDinner.cook && (
                    <span className={cookMeta(todaysDinner.cook).cls}>{cookMeta(todaysDinner.cook).label}</span>
                  )}
                </div>

                <h2 className="hero-title">{todaysDinner.name}</h2>

                <div className="hero-meta">
                  <span>{todaysDinner.prepTime}</span>
                  <MealSwapModal
                    dateStr={days[0].targetDateStr}
                    mealType="Dinner"
                    currentMealName={todaysDinner.name}
                    inventory={rawInventory}
                    label="Swap dinner"
                    buttonStyle={{
                      background: "var(--gold-fill)",
                      color: "var(--gold-ink)",
                      border: "none",
                      borderRadius: "999px",
                      padding: "9px 20px",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                {/* Lunch rides along inside the Tonight card */}
                <div className="hero-lunch">
                  <span className="ovl grn">Lunch</span>
                  {todaysLunch ? (
                    <>
                      <span className="nm">{todaysLunch.name}</span>
                      {todaysLunch.cook && (
                        <span className={cookMeta(todaysLunch.cook).cls}>{cookMeta(todaysLunch.cook).label}</span>
                      )}
                      <span className="mt">{todaysLunch.prepTime}</span>
                    </>
                  ) : (
                    <span className="nm" style={{ color: "var(--text-tertiary)" }}>
                      Not scheduled
                    </span>
                  )}
                </div>

                {tomorrowsDinner && tomorrowsDinner.name !== "No meal scheduled" && (
                  <div className="hero-tmrw">
                    Tomorrow — <b>{tomorrowsDinner.name}</b>
                    <span className={cookMeta(tomorrowsDinner.cook).cls}>{cookMeta(tomorrowsDinner.cook).label}</span>
                  </div>
                )}
              </div>

              <div className="tonight-photo">
                <img src={getSmartMealImage(todaysDinner, 0)} alt={todaysDinner.name} />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Utensils size={40} />
              <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>No dinner scheduled</span>
              <span style={{ fontSize: "0.9rem" }}>Tap Regenerate to plan the month</span>
            </div>
          )}
        </article>

        {/* MIDDLE COLUMN — two stacked minis */}
        <div className="trio2">
          {/* This Evening */}
          <article className="widget mini">
            <div className="mini-top">
              <span className="ovl">This Evening</span>
              {schedule.length > 0 ? (
                <span className="chip gld">
                  {schedule.length} event{schedule.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="chip grn">Free</span>
              )}
            </div>
            {schedule.length > 0 ? (
              <>
                <div className="mini-val">
                  <span className="t">{schedule[0].title}</span>
                </div>
                <div className="mini-sub">
                  {schedule[0].time}
                  {schedule.length > 1 ? ` · +${schedule.length - 1} more` : ""}
                </div>
              </>
            ) : (
              <>
                <div className="mini-val">
                  <span className="dot-em" />
                  Evening free
                </div>
                <div className="mini-sub">Nothing on the calendar after 5 pm</div>
              </>
            )}
          </article>

          {/* Groceries */}
          <article className="widget mini">
            <div className="mini-top">
              <span className="ovl">Groceries</span>
              {groceryItems.length > 0 && (
                <span className="chip gld">{toBuyCount + restockCount} items</span>
              )}
            </div>
            {groceryItems.length > 0 ? (
              <>
                <div className="mini-val">
                  <span className="t">{toBuyCount > 0 ? "Ready to shop" : "All stocked"}</span>
                </div>
                <div className="mini-sub">{groceryPreview}</div>
              </>
            ) : (
              <>
                <div className="mini-val">
                  <span className="t">List empty</span>
                </div>
                <div className="mini-sub">Schedule meals to generate the list</div>
              </>
            )}
          </article>
        </div>

        {/* MEMORIES — full-bleed photo + scrim */}
        <FamilyPhotoFrame photos={familyPhotos} />
      </section>

      {/* ===== WEEK BAND ===== */}
      <section className="week-band">
        <div className="week-head">
          <span className="ovl">The Week Ahead</span>
          <div className="seg">
            {filterOpts.map((opt) => (
              <a key={opt.key} href={opt.key === "all" ? "/" : `/?cook=${opt.key}`} className={cookFilter === opt.key ? "on" : ""}>
                {opt.label}
              </a>
            ))}
          </div>
          <span className="week-cap">{weekCap}</span>
        </div>

        <div
          className="days"
          style={{ gridTemplateColumns: `repeat(${Math.max(filteredDays.length, 1)}, 1fr)` }}
        >
          {filteredDays.map((day) => (
            <div key={day.targetDateStr} className={`day${day.isToday ? " today" : ""}`}>
              <div className="day-h">
                <span className="dw">{day.dayNameShort}</span>
                <span className="dn">{day.dayNum}</span>
                {day.isToday && <span className="today-tag">Today</span>}
              </div>

              {/* Lunch */}
              {day.lunch ? (
                <div className="meal">
                  <div className="m-top">
                    <span className="m-lab lun">Lunch</span>
                    <span className="m-time">{day.lunch.prepTime}</span>
                    <MealSwapModal
                      dateStr={day.targetDateStr}
                      mealType="Lunch"
                      currentMealName={day.lunch.name}
                      inventory={rawInventory}
                      label=""
                      buttonStyle={{ background: "transparent", border: "none", color: "var(--text-tertiary)", padding: "2px 4px" }}
                    />
                  </div>
                  <div className="m-name">{day.lunch.name}</div>
                  {day.lunch.cook && (
                    <div className="m-cook">
                      <span className={cookMeta(day.lunch.cook).cls}>{cookMeta(day.lunch.cook).label}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="meal empty">
                  <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>No lunch</span>
                </div>
              )}

              {/* Dinner */}
              {day.dinner ? (
                <div className="meal">
                  <div className="m-top">
                    <span className="m-lab din">Dinner</span>
                    <span className="m-time">{day.dinner.prepTime}</span>
                    <MealSwapModal
                      dateStr={day.targetDateStr}
                      mealType="Dinner"
                      currentMealName={day.dinner.name}
                      inventory={rawInventory}
                      label=""
                      buttonStyle={{ background: "transparent", border: "none", color: "var(--text-tertiary)", padding: "2px 4px" }}
                    />
                  </div>
                  <div className="m-name">{day.dinner.name}</div>
                  {day.dinner.cook && (
                    <div className="m-cook">
                      <span className={cookMeta(day.dinner.cook).cls}>{cookMeta(day.dinner.cook).label}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="meal empty">
                  <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>No dinner</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
