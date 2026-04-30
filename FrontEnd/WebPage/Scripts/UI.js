/** A fonctionnal animated window */
class UI_Window{
    /** 
    * Window constructor
    * @param {HTMLElement} HTML - The HTML root element of the window
    * @return {object} - The created window object
    */
    constructor(HTML) {
        this.HTML = HTML;
        this.HTMLFrame = HTML.querySelector(".UI_WindowFrame");

        this.state = "CLOSED";
        
        this.HTMLFrame.style.transition = "opacity 0.2s ease-in";
        this.closeInstant() // Initial state is CLOSED
    }
    /** 
    * Closes the window with no animation
    * @return {null} - No return
    */
    closeInstant(){
        this.state = "CLOSED";
        this.HTMLFrame.style.display="none";
        this.HTMLFrame.style.opacity="0";
    }
    /** 
    * Closes the window with animation
    * @return {null} - No return
    */
    close(){
        this.state = "CLOSED";
        this.HTMLFrame.style.opacity="0";
        setTimeout(function(w){
            w.HTMLFrame.style.display="none";
        },200,this);
    }
    /** 
    * Opens the window with animation
    * @return {null} - No return
    */
    open(){
        this.state = "OPEN";
        this.HTMLFrame.style.display="flex";
        
        // Little delay to let the display be processed and avoid jumping
        setTimeout(function(w){
            w.HTMLFrame.style.opacity="1";
        },10,this);
    }
}


/** A fonctionnal button with state and signals */
class UI_Button {
    /** 
    * Button constructor
    * @param {HTMLElement} HTML - The HTML root element of the button
    * @param {Function} callBackObTarget - The object from which to callback, pass null for execution without object
    * @param {Function} callback - The callback function. Will be called with this button object as first argument.
    * @return {object} - The created button object
    */
    constructor(HTML, callBackObTarget, callback) {
        this.HTML = HTML;
        this.callBackObTarget = callBackObTarget;
        this.callback = callback;

        this.setState("OFF");

        this.HTML.UI_ob = this // To find back object in events callbacks
        this.HTML.addEventListener("click",this.clicked);
    }

    /** 
    * Called when the click event is fired
    * @param {Event} ev - Event fired
    * @return {null} Returns no value
    */
    clicked(ev){
        const self = ev.currentTarget.UI_ob;
        self.switchState();
        if (self.state != "DISABLED"){
            if (self.callBackObTarget == null){
                self.callback(self);
            }else{
                self.callback.call(self.callBackObTarget,self);
            }
        }
    }
    /** 
    * Switches the button state
    * @return {string} Returns the string representing the new button status
    */
    switchState(){
        if (this.state != "DISABLED"){
            if (this.state == "OFF"){
                this.setState("ON");
            }else{
                this.setState("OFF");
            }
        }
        return this.state;
    }
    /** 
    * Sets the button state and style it accordingly
    * @param {String} state - Either "ON", "OFF" or "DISABLED"
    * @return {null} Returns no value
    */
    setState(state){
        this.state = state;
        switch(state){
            case "ON":
                this.HTML.style.opacity = 1;
                this.HTML.style.color = gameConfig.colors["foreground"];
                this.HTML.style.borderColor = gameConfig.colors["foreground"];
                this.HTML.style.cursor = "pointer";
                break;
            case "OFF":
                this.HTML.style.opacity = 1;
                this.HTML.style.color = gameConfig.colors["foreground_fade"];
                this.HTML.style.borderColor = gameConfig.colors["foreground_fade"];
                this.HTML.style.cursor = "pointer";
                break;
            case "DISABLED":
                this.HTML. style.opacity = 0.5;
                this.HTML.style.color = gameConfig.colors["foreground_fade"];
                this.HTML.style.borderColor = gameConfig.colors["foreground_fade"];
                this.HTML.style.cursor = "not-allowed";
                break;
        }
    }
}

/** Displays different elements by user selection of tabs */
class UI_TabView{
    /**
     * @param {HTMLElement} HTML - Tab view root HTML element
     */
    constructor(HTML){
        this.HTML = HTML;
        /** @type {HTMLElement{}} - Tabs HTML stored by tabID */
        this.tabs = {}
    }
    /**
     * @param {string} tabID - The tab ID
     * @param {string} tabName - The tab name to be displayed
     * @param {HTMLElement} HTML - The HTML to be displayed when the tab is active
     */
    addTab(tabID, name, HTML){
        const newTabButton = document.createElement("div");
        newTabButton.className = "UI_TabViewButton";
        const newP = document.createElement("p");
        newP.innerHTML = name;
        newTabButton.appendChild(newP);
        this.HTML.querySelector(".UI_TabViewButtonsDiv").appendChild(newTabButton);

        newTabButton.tabView = this;
        newTabButton.tabID = tabID;
        newTabButton.onclick = function(ev){
            ev.currentTarget.tabView.setTab(ev.currentTarget.tabID);
        }

        this.tabs[tabID] = {
            "name":name,
            "HTMLContent": HTML,
            "HTMLButton": newTabButton
        }

        this.setTab(tabID);
    }
    /** 
     * Set the current tab to tabID
     * @param {string} tabID - The tab ID to display
     */
    setTab(tabID){
        for (var tab in this.tabs){
            if (tab == tabID){
                this.tabs[tab].HTMLContent.style.display = "flex";
                this.tabs[tab].HTMLButton.style.backgroundColor = gameConfig.colors["background-light"];
            }else{
                this.tabs[tab].HTMLContent.style.display = "none";
                this.tabs[tab].HTMLButton.style.backgroundColor = "";
            }
        }
    }
}

/** An animated number display with rolling digits */
class UI_RollingNumber{
    /**
     * @param {HTMLElement} HTML - Digit root HTML element
     * @param {number} ndigits - Number of digits to display
     * @param {number} transitionTime - Animation time for a roll in ms
     */
    constructor(HTML,ndigits, transitionTime){
        this.transitionTime = transitionTime;

        this.HTML = document.createElement("div");
        this.HTML.className = "UI_RollingNumberDiv";
        HTML.appendChild(this.HTML);
        this.digits = [];

        /** @type {number} - The current value displayed */
        this.value = 0;

        // Create subelements:
        for (var d=0; d<ndigits; d++){
            const newDigitWindow = document.createElement("div");
            newDigitWindow.className = "UI_RollingNumberDigitWindow";
            this.HTML.appendChild(newDigitWindow);
            this.digits.push(newDigitWindow);

            const newStrip = document.createElement("div");
            newStrip.className = "UI_RollingNumberStrip";
            newStrip.topPosition = 0;
            newStrip.previousValue = 0;
            newStrip.style.transition = "top "+this.transitionTime+"ms linear";
            newDigitWindow.appendChild(newStrip);

            newStrip.appendChild(this.createDigit(0));
        }

        // Store size info:
        this.digitHeight = this.HTML.querySelector(".UI_RollingNumberDigitDiv").getBoundingClientRect().height;
    }
    createDigit(value){
        const newDigitDiv = document.createElement("div");
        newDigitDiv.className = "UI_RollingNumberDigitDiv";

        const newDigitP = document.createElement("p");
        newDigitP.className = "UI_RollingNumberDigitP";
        newDigitP.innerHTML = value;
        newDigitDiv.appendChild(newDigitP);
        return newDigitDiv;
    }
    setValue(value){
        if (isNaN(value)){throw new Error("Cannot set rolling number value: "+value);}
        value = Math.round(value);
        const evolutionSign = Math.sign(value-this.value);
        var selector = 10;
        var valueForSplit = value;
        for (var d in this.digits){
            // Black magic to get each number:
            var digitValue = valueForSplit%selector;            
            valueForSplit -= digitValue;
            digitValue = digitValue/(selector/10); // Holds the digit to be displayed at this position
            selector = 10*selector;

            const digitIndex = this.digits.length-1-d;
            const strip = this.digits[digitIndex].querySelector(".UI_RollingNumberStrip")

            // Remove child nodes:
            strip.innerHTML = ""
            
            // Current value
            const digit = this.createDigit(strip.previousValue);
            digit.style.top = -strip.topPosition+"px";
            strip.append(digit);

            // Transition values
            var transitionDigit = strip.previousValue;
            var count = 1;

            while (transitionDigit != digitValue){
                transitionDigit += evolutionSign;
                if (transitionDigit == 10){transitionDigit = 0}
                if (transitionDigit == -1){transitionDigit = 9}

                const digit = this.createDigit(transitionDigit);
                digit.style.top = -strip.topPosition + this.digitHeight*count*evolutionSign+"px";
                strip.append(digit);
                count++;
            }

            strip.topPosition -= evolutionSign*(count-1)*this.digitHeight;
            strip.style.top = strip.topPosition+"px";
            strip.previousValue = digitValue;
        }
        this.value = value;
    }
    
}

export {UI_Window, UI_Button, UI_TabView, UI_RollingNumber}