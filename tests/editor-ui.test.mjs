import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEditorUi, editorUiDefaults } from "../src/editor-ui.mjs";
import { filmstripTiles } from "../src/filmstrip.mjs";
test("preferencias de navegación válidas sobreviven a serialización y entradas antiguas usan defaults", () => {
  const value = {
    styleTab: "customize",
    subtitleTab: "timing",
    styleSection: "position",
    selectedLine: "lower",
    coverSection: "title",
  };
  assert.deepEqual(normalizeEditorUi(JSON.parse(JSON.stringify(value))), value);
  assert.deepEqual(normalizeEditorUi(null), editorUiDefaults);
  assert.deepEqual(
    normalizeEditorUi({ styleTab: "no-existe", coverSection: 15 }),
    editorUiDefaults,
  );
  assert.deepEqual(normalizeEditorUi({ coverSection: "crop" }), {
    ...editorUiDefaults,
    coverSection: "crop",
  });
});
test("miniaturas compactas mantienen proporción y fotogramas dentro del sprite", () => {
  for (const aspect of [9 / 16, 16 / 9, 0.2]) {
    const tiles = filmstripTiles(1600, 400, 500, aspect, 40, 36);
    assert.ok(tiles.length > 0);
    for (const tile of tiles) {
      assert.equal(tile.height, 36);
      assert.ok(Math.abs(tile.width - tile.height * aspect) <= 0.5);
      assert.ok(tile.index >= 0 && tile.index < 40);
    }
  }
});
