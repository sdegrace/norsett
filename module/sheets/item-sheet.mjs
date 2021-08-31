import {onManageActiveEffect} from "../helpers/effects.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class NorseItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["norsett", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}]
        });
    }

    /** @override */
    get template() {
        const path = "systems/norsett/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.item.data;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = itemData.data;
        context.flags = itemData.flags;

        // this._prepareLinks(context);

        return context;
    }

    _prepareLinks(context) {
        let newList = [];
        switch (this.item.data.type) {
            case "bodyPart":
                this._preparePhysical(context);
                newList = [];
                for (const key of context.data.layers) {
                    let match = game.items.get(key);
                    if (match) {
                        newList = newList.concat(match);
                    }

                }
                context.data.layers = newList;
                break;
            case "consumable":
                break;
            case "general":
                break;
            case "injury":
                break;
            case "material":
                break;
            case "organ":
                this._preparePhysical(context);

                newList = [];
                for (const key of context.data.injuries) {
                    let match = game.items.get(key);
                    if (match) {
                        newList = newList.concat(match);
                    }

                }
                context.data.injuries = newList;
                break;
            case "partLayer":
                this._preparePhysical(context);
                newList = [];
                for (const key of context.data.organs) {
                    let match = game.items.get(key);
                    if (match) {
                        newList = newList.concat(match);
                    }

                }
                context.data.organs = newList;
                break;
            case "wearable":
                this._preparePhysical(context);
                break;
            case "wieldable":
                this._preparePhysical(context);
                // newList = [];
                // for (const key of context.data.functions) {
                //     let match = game.items.get(key);
                //     if (match) {
                //         newList = newList.concat(match);
                //     }
                //
                // }
                // context.data.functions = newList;

                break;
        }
    }

    _preparePhysical(context) {
        let key = context.data.baseMaterial
        if (context.data.baseMaterial) {
            context.data.baseMaterial = game.items.get(context.data.baseMaterial);
        }
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;
        html.on('drop', (e) => this._onDrop(e.originalEvent));

        html.find(".function-control").click(ev => this.onManageItemFunction(ev));

        // Delete Inventory Item
        html.find('.material-delete').click(ev => {
            // const item = game.items.get(this.item.id);
            const item = this.item;
            item.update({["data.baseMaterial"]: ""});
        });
        html.find('.injury-delete').click(ev => {
            // const item = game.items.get(this.item.id);
            const item = this.item;
            let injuries = item.data.data.injuries;
            injuries.filter(item => item !== ev.currentTarget.dataset.id);
            item.update({["data.injuries"]: injuries});
        });
        html.find('.organ-delete').click(ev => {
            // const item = game.items.get(this.item.id);
            const item = this.item;
            let organs = item.data.data.organs;
            organs.filter(item => item !== ev.currentTarget.dataset.id);
            item.update({["data.organs"]: organs});
        });
        html.find('.layer-delete').click(ev => {
            // const item = game.items.get(this.item.id);
            const item = this.item;
            let layers = item.data.data.layers;
            layers.filter(item => item !== ev.currentTarget.dataset.id);
            item.update({["data.layers"]: layers});
        });

        // Roll handlers, click handlers, etc. would go here.
    }

    _anyParentContains(element, query) {
        if (element.parentNode && element.classList.contains(query)) {
            return true;
        }
        return element.parentNode?this._anyParentContains(element.parentNode, query):false;
    }

    _onDrop(event) {
        let dropped_id = JSON.parse(event.dataTransfer?.getData('text/plain')).id;
        const item = this.item;
        // let inner = push(dropped_id);
        let dropped_item = game.items.get(dropped_id);
        const droppedOn = event.target;
        if (dropped_item.type == "material" && droppedOn.classList.contains("material-droppable")) {
            return item.update({["data.baseMaterial"]: dropped_id});
        } else if (dropped_item.type == "injury" && droppedOn.classList.contains("injury-droppable")) {
            if (!item.data.data.injuries.includes(dropped_id))
                return item.update({["data.injuries"]: [...item.data.data.injuries, dropped_id]});
        } else if (dropped_item.type == "organ" && droppedOn.classList.contains("organ-droppable")) {
            if (!item.data.data.organs.includes(dropped_id))
                return item.update({["data.organs"]: [...item.data.data.organs, dropped_id]});
        } else if (dropped_item.type == "partLayer" && droppedOn.classList.contains("layer-droppable")) {
            if (!item.data.data.layers.includes(dropped_id))
                return item.update({["data.layers"]: [...item.data.data.layers, dropped_id]});
        } else if (dropped_item.type == "attackType" && this._anyParentContains(droppedOn, "attackType-droppable")) {
            console.log("Droppable :)")
        }
    }

    onManageItemFunction(event) {
        event.preventDefault();
        event.stopPropagation();
        const a = event.currentTarget;
        const li = a.closest("li");
        // const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
        switch ( a.dataset.action ) {
            case "create":
            const last_id = this.item.data.data.functions.length > 0?this.item.data.data.functions.slice(-1)[0].id:0;
            let newFuncs = this.item.data.data.functions.concat(
                {
                    "id": last_id + 1,
                    "label": "name",
                    "skillUsed": "Skill",
                    "isAttack": true,
                    "sharpness": 1.0,
                    "size": 1.0,
                    "damageType": "cutting"
                });
                this.item.update({["data.functions"]: newFuncs});
                console.log(this.item.data.data.functions)
                return

            // case "edit":
            //     return effect.sheet.render(true);
            case "delete":
                return this.item.update({["data.functions"]: this.item.data.data.functions.filter(f => f.id != li.dataset.functionId)});
            // case "toggle":            //     return effect.update({disabled: !effect.data.disabled});
        }
    }
}


