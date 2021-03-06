export default class itemSearchApp extends FormApplication {
    setWindowData (filteredItems, allItems, source) {
        this.filteredItems = filteredItems;
        this.allItems = allItems;
        this.source = source;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "paper-doll-item-search",
            template: "systems/norsett/templates/actor/actor-sheet.html",
            resizable: false,
            minimizable: false,
            submitOnClose: true,
            title: "Item Search",
        }
    }

    getData(options) {
        return {
            allItems: this.allItems,
            filteredItems: this.filteredItems
        }
    }

    /**
     * Creates an image tile in the place of the clicked button
     *
     * @param item - item to "equip"
     */
    createNewTile(item) {
        createImageTile(item, this.source.currentTarget);
        this.close();
    }

    /**
     * Gets the item from the id of the clicked object on the grid
     *
     * @param source - event trigger by the click
     * @param itemList - items available for equipment
     */
    prepareDataForNewTile(source, itemList) {
        const selectedItemId = source.currentTarget.id;
        const selectedItem = itemList.filter((item) => item.data._id === selectedItemId)[0];
        this.createNewTile(selectedItem);
    }

    /**
     * Hides the items that do not match the text into the search bar
     *
     * @param event - new character added to the search bar
     */
    searchItems(event) {
        const itemObjectsArray = [...event.currentTarget.parentNode.firstElementChild.children];

        itemObjectsArray.forEach((itemObject) => {
            const itemObjectText = itemObject.lastElementChild.innerText.toLowerCase();
            const searchText = event.currentTarget.value.toLowerCase();

            if (!itemObjectText.includes(searchText) || $(itemObject).hasClass('notInFilter')) {
                $(itemObject).hide();
            } else $(itemObject).show();
        })
    }

    async _updateObject(event, formData) {

    }

    findEquippedItems() {
        const IDs = [];
        $('.itemSlotsGrid').children('div .addedItem').each((index, item) => IDs.push(item.id));
        return IDs;
    }

    /**
     * When the list is made all equipable items are loaded, this function hides the ones that do not match the filter on
     * the current slot, idk why I made it this way
     *
     * @param displayedItems - JQ object of all the items in the list
     * @param filteredItems - the items that match the slot filter
     */
    hideNonFilteredItems(displayedItems, filteredItems) {
        const filteredItemsIds = [];
        const equippedItems = this.findEquippedItems();
        filteredItems.forEach((item) => filteredItemsIds.push(item.data._id));
        displayedItems.each((index, item) => {
            if (!(filteredItemsIds.includes(item.id)) || equippedItems.includes(item.id)) {
                item.style.display = 'none';
                $(item).addClass('notInFilter');
            }
        })
    }

    activateListeners(html) {
        const itemsFromDisplay = html.find('.searchInternalGrid');
        itemsFromDisplay.on('click', (source) => this.prepareDataForNewTile(source, this.allItems));
        this.hideNonFilteredItems(itemsFromDisplay, this.filteredItems)

        const searchBar = html.find('.searchBar');
        searchBar.on('input', this.searchItems)
    }
}