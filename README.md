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
| `manifest.webmanifest` | Instalacja na telefonie i opcja „Udostępnij → Versus” na Androidzie |
| `sw.js` | Service worker, dzięki któremu aplikacja otwiera się też offline |
| `icons/` | Ikony aplikacji |
