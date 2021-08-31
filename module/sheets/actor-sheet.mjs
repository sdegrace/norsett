import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class NorseActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["norsett", "sheet", "actor"],
      template: "systems/norsett/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: (game.user.isGM ? "gm" : "features") }]
    });
  }

  /** @override */
  get template() {
    // return `systems/norsett/templates/actor/actor-${this.actor.data.type}-sheet.html`;
    return `systems/norsett/templates/actor/actor-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    this._prepareItems(context);
    this._prepareCharacterData(context);
    this._prepareCharacterDescription(context);


    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    context.thorSkills = {};
    context.odinSkills = {};
    context.lokiSkills = {};
    for (let [k, v] of Object.entries(context.data.skills)) {
      v.label = game.i18n.localize("NORSETT.skills." + k) ?? k;
       context[v.deity+"Skills"][k] = v;
    }
    // Handle deities
    for (let [k, v] of Object.entries(context.data.favor)) {
      v.label = game.i18n.localize("NORSETT.deities." + k) ?? k;
    }
    context.isGM = game.user.isGM;
  }

  _prepareCharacterDescription(context) {
    const physical = context.data.characterAttributes;
    const health = context.data.healthAttributes;
    physical.description = "";
    if (context.isGM) {
      physical.description = game.i18n.localize("NORSETT.sheets.general.GMKnowsAll") ?? "NORSETT.sheets.general.GMKnowsAll";
    }
    if (this.actor.isOwner) {
      var locArray = game.i18n.localize("NORSETT.sheets.actor.ownedPhysicalDesc");
      physical.description = locArray[0] + physical.height + locArray[1] + physical.weight + locArray[2];
        var heartRate
      if (health.heartRate.value < (health.heartRate.resting - (health.heartRate.resting - health.heartRate.min) / 2)) {
        heartRate = game.i18n.localize("NORSETT.sheets.actor.effortOptions")[0];
      } else if ((health.heartRate.resting - (health.heartRate.resting - health.heartRate.min) / 2) < health.heartRate.value < (health.heartRate.resting + (health.heartRate.max - health.heartRate.resting) / 3)) {
        heartRate = game.i18n.localize("NORSETT.sheets.actor.effortOptions")[1];
      } else if (health.heartRate.value < (health.heartRate.resting + (health.heartRate.max - health.heartRate.resting) / 3) < health.heartRate.value < (health.heartRate.max - (health.heartRate.max - health.heartRate.resting) / 3)) {
        heartRate = game.i18n.localize("NORSETT.sheets.actor.effortOptions")[2];
      } else {
        heartRate = game.i18n.localize("NORSETT.sheets.actor.effortOptions")[3]
      }
    }
    physical.description += "\n" + game.i18n.localize("NORSETT.sheets.actor.ownedHeartbeatDesc") + heartRate;
  }

  _

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: []
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;
   }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  _onDrop(event) {
    let dropped_id = JSON.parse(event.dataTransfer?.getData('text/plain')).id;
    // let inner = push(dropped_id);
    const actor = this.actor;
    let dropped_item = game.items.get(dropped_id);
    const droppedOn = event.target;
    if (dropped_item.type == "wearable" && droppedOn.classList.contains("wearable-droppable")) {
      dropped_item.data.data.equipsOnType
    } else if (dropped_item.type == "wieldable" && droppedOn.classList.contains("wieldable-droppable")) {
      console.log(dropped_item)
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[roll] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData()).roll();
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
