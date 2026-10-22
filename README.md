# Versus – porównywarka produktów

Mobilna aplikacja (PWA) do porównywania produktów po linkach. Wklejasz linki do dwóch (albo do czterech) produktów ze sklepów. Claude otwiera strony, wyciąga z nich parametry i cenę, a potem zestawia produkty obok siebie.

Wzorowane na najlepszych porównywarkach:
- **versus.com**: ocena 0–100, „Lepszy wybór”, liczba wygranych kategorii,
- **GSMArena / RTINGS**: parametry w grupach, podświetlona lepsza wartość, przełącznik „Tylko różnice”,
- **Ceneo**: cena na górze, plusy i minusy, werdykt i podpowiedź, dla kogo który produkt.

## Jak wrzucać linki

- **Android**: zainstaluj aplikację (Chrome → menu → „Dodaj do ekranu głównego”). Potem w sklepie albo w przeglądarce wybierz **Udostępnij → Versus**. Pierwszy link trafia do miejsca A, drugi do B. Gdy oba są pełne, porównanie startuje samo.
- **iPhone**: Safari → Udostępnij → „Do ekranu początkowego”. iOS nie pozwala aplikacjom webowym pojawiać się w menu Udostępnij, więc link kopiujesz i wklejasz.
- **Komputer**: wklej link w dowolnym miejscu strony (Ctrl+V) albo przeciągnij go na stronę.

Można też otworzyć aplikację z linkiem w adresie: `…/?url=https://sklep.pl/produkt`.

## Klucz API

Aplikacja korzysta z Claude przez API Anthropic, więc potrzebny jest klucz API z [platform.claude.com](https://platform.claude.com/settings/keys). Klucz wpisujesz w aplikacji (przycisk „Klucz API”). Zostaje tylko w Twojej przeglądarce (localStorage) i jest wysyłany wyłącznie do `api.anthropic.com`.

Każde porównanie to kilka zapytań do API. Koszt zależy od wielkości stron sklepów, zwykle wychodzi około 1–3 zł. Nie udostępniaj nikomu urządzenia z zapisanym kluczem.

Model: `claude-opus-5-5`, z narzędziem `web_fetch` do czytania stron sklepów. Gdy sklep blokuje pobieranie, Claude korzysta z własnej wiedzy, a cena jest oznaczona jako „szacunek”. Wtedy pomaga dodanie zrzutu ekranu strony albo wklejenie jej tekstu.

## Żeby działało u innych bez klucza

Domyślnie każdy użytkownik wpisuje w aplikacji własny klucz API. Jeśli chcesz, żeby każdy mógł po prostu wejść i porównywać, postaw darmowego pośrednika na Cloudflare Workers (folder `worker/`). Pośrednik trzyma Twój klucz w ukryciu, a koszty zapytań idą z Twojego konta API.

1. Załóż darmowe konto na [dash.cloudflare.com](https://dash.cloudflare.com).
2. Wejdź w **Workers & Pages → Create → Create Worker**, nazwij go `versus-proxy` i kliknij **Deploy**.
3. Kliknij **Edit code**, usuń przykładowy kod, wklej całą zawartość `worker/worker.js` i kliknij **Deploy**.
4. Wejdź w **Settings → Variables and Secrets → Add**, wybierz typ **Secret**, nazwa `ANTHROPIC_API_KEY`, wartość: Twój klucz API. Zapisz i wdroż.
5. Skopiuj adres workera (np. `https://versus-proxy.twoja-nazwa.workers.dev`) i wpisz go w pliku `config.js` w polu `proxyUrl`.
6. **Ustaw limit wydatków** na [platform.claude.com](https://platform.claude.com) (Settings → Limits), np. 50 zł miesięcznie. To najważniejsze zabezpieczenie, bo adres pośrednika jest publiczny.

Pośrednik przepuszcza tylko zapytania z Twojej strony na GitHub Pages i tylko w kształcie, którego używa aplikacja. Model i limity ustawia sam. Jeden adres IP może wysłać 30 zapytań na godzinę (zmienna `LIMIT_PER_HOUR`). To hamuje nadużycia, ale nie zastąpi limitu wydatków.

## Uruchomienie na GitHub Pages

1. W repozytorium wejdź w **Settings → Pages**.
2. W „Build and deployment” wybierz **Source: Deploy from a branch**, gałąź **main** i folder **/ (root)**, a potem **Save**.
3. Po minucie aplikacja będzie pod adresem `https://<twoja-nazwa>.github.io/<nazwa-repo>/`.

## Uruchomienie lokalnie

```bash
python3 -m http.server 8000
```

Potem otwórz http://localhost:8000.

## Pliki

| Plik | Co robi |
|---|---|
| `index.html` | Cała aplikacja: wygląd, logika i połączenie z Claude |
| `config.js` | Adres pośrednika (puste = każdy wpisuje własny klucz) |
| `worker/` | Pośrednik dla Cloudflare Workers, który ukrywa klucz API |
| `manifest.webmanifest` | Instalacja na telefonie i opcja „Udostępnij → Versus” na Androidzie |
| `sw.js` | Service worker, dzięki któremu aplikacja otwiera się też offline |
| `icons/` | Ikony aplikacji |
