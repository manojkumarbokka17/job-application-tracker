import { WORK_MODES } from '../utils/constants';

export default function FilterBar({ search, onSearch, mode, onMode, country, onCountry, countries, sort, onSort }) {
  return (
    <section className="filters" aria-label="Filter applications">
      <input
        type="search"
        className="filters__search"
        placeholder="Search company, title, city or skills…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search applications"
      />
      <select value={country} onChange={(e) => onCountry(e.target.value)} aria-label="Filter by country">
        <option value="all">All countries</option>
        {countries.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select value={mode} onChange={(e) => onMode(e.target.value)} aria-label="Filter by work mode">
        <option value="all">All work modes</option>
        {WORK_MODES.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Sort applications">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="score">Best match first</option>
        <option value="company">Company A–Z</option>
      </select>
    </section>
  );
}
