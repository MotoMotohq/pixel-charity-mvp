import { formatKzt } from "../lib/app-data";

const ROWS = [
  { pair: "Стипендии детям", last: 84_200, chg: 1.24, vol: 3_820_000_000 },
  { pair: "Лечение животных", last: 218_400, chg: -0.42, vol: 1_240_000_000 },
  { pair: "Поддержка приютов", last: 1.02, chg: 0.08, vol: 410_000_000 },
  { pair: "Пожилые люди", last: 3_180, chg: 2.1, vol: 980_000_000 },
  { pair: "Экстренная помощь", last: 104_500, chg: 0.55, vol: 220_000_000 },
  { pair: "Образовательные наборы", last: 56_200, chg: -0.18, vol: 640_000_000 }
];

export default function MarketsPage() {
  return (
    <section className="page-hero">
      <p className="hero-kicker">Кампании фонда</p>
      <h1>Направления, которым вы можете помочь прямо сейчас</h1>
      <p className="lead">
        Выберите кампанию по приоритету: лечение, питание, образование и экстренная поддержка детей и животных.
      </p>

      <div className="section-head" style={{ marginTop: "2rem" }}>
        <h2>Сводка активных кампаний</h2>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Кампания</th>
              <th>Собрано</th>
              <th>Рост 24ч</th>
              <th>Оборот 24ч</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.pair}>
                <td>
                  <strong>{row.pair}</strong>
                </td>
                <td>{formatKzt(row.last)}</td>
                <td className={row.chg >= 0 ? "chg--up" : "chg--down"}>
                  {row.chg >= 0 ? "+" : ""}
                  {row.chg.toFixed(2)}%
                </td>
                <td>{formatKzt(row.vol)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid--below-hero">
        <article className="card">
          <span className="kicker">01</span>
          <h2>Прозрачность по каждой кампании</h2>
          <p>Все поступления фиксируются on-chain, а ключевые метрики обновляются в реальном времени.</p>
        </article>
        <article className="card">
          <span className="kicker">02</span>
          <h2>Целевые направления помощи</h2>
          <p>Каждая кампания описывает проблему, объём нужной помощи и ожидаемый социальный эффект.</p>
        </article>
        <article className="card">
          <span className="kicker">03</span>
          <h2>Регулярная отчётность</h2>
          <p>Фонд публикует обновления по использованию средств и достигнутым результатам.</p>
        </article>
      </div>

      <div className="two-col-section" style={{ marginTop: "2rem" }}>
        <article className="card">
          <h2>Как выбрать кампанию</h2>
          <p>Оцените срочность, цель сбора и текущий прогресс. Вы можете поддержать одну кампанию или распределить сумму.</p>
          <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            <li>Срочные медицинские случаи</li>
            <li>Долгосрочные образовательные программы</li>
            <li>Экстренная гуманитарная поддержка</li>
          </ul>
        </article>
        <article className="card card--pulse">
          <h2>Этика и безопасность</h2>
          <p>Пожертвования добровольны. Перед отправкой суммы изучите описание кампании и публичную отчётность фонда.</p>
        </article>
      </div>

      <div className="grid" style={{ marginTop: "1.25rem" }}>
        <article className="card">
          <h2>Дети и образование</h2>
          <p>Стипендии, школьные наборы, оборудование и развитие безопасной среды обучения.</p>
        </article>
        <article className="card">
          <h2>Животные и приюты</h2>
          <p>Лечение, корм, стерилизация и оснащение приютов для бездомных животных.</p>
        </article>
        <article className="card">
          <h2>Пожилые и экстренная помощь</h2>
          <p>Лекарства, уход и срочная адресная поддержка людям в уязвимой ситуации.</p>
          <p className="muted-line" style={{ marginTop: "0.5rem" }}>
            <small>Приоритеты обновляются в зависимости от реальных запросов и подтверждённых кейсов.</small>
          </p>
        </article>
      </div>
    </section>
  );
}
