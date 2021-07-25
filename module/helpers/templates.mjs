/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
        // Actor partials.
        "systems/norsett/templates/actor/parts/actor-features.html",
        "systems/norsett/templates/actor/parts/actor-items.html",
        "systems/norsett/templates/actor/parts/actor-GM.html",
        "systems/norsett/templates/actor/parts/actor-effects.html",
        // Item partials
        "systems/norsett/templates/item/parts/physical.html",
        "systems/norsett/templates/item/parts/description.html",
        "systems/norsett/templates/item/parts/equipable.html",
        "systems/norsett/templates/item/parts/crafted.html",
        "systems/norsett/templates/item/parts/attackTypes.html",

    ]);
};
