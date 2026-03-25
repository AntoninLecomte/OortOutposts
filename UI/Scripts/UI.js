/**
* A fonctionnal animated window
*/
class UI_Window{
    /** 
    * Window constructor
    * @param {HTMLElement} HTML - The HTML root element of the window
    * @return {object} - The created window object
    */
    constructor(HTML) {
        this.HTML = HTML;
        this.HTMLContent = HTML.querySelector(".UI_WindowContent");
        this.referenceWidth = this.HTML.getBoundingClientRect().width;

        this.state = "CLOSED";
        
        this.HTMLContent.style.transition = "max-width 0.2s ease-in, opacity 0.2s ease-in";
        this.closeInstant() // Initial state is CLOSED
    }
    /** 
    * Closes the window with no animation
    * @return {null} - No return
    */
    closeInstant(){
        this.state = "CLOSED";
        this.HTMLContent.style.maxWidth = 0+"px";
        this.HTMLContent.style.display="none";
        this.HTMLContent.style.opacity="0";
        this.HTML.style.justifyContent = "flex-end";
    }
    /** 
    * Closes the window with animation
    * @return {null} - No return
    */
    close(){
        this.state = "CLOSED";
        this.HTMLContent.style.maxWidth = 0+"px";
        this.HTMLContent.style.opacity="0";
        this.HTML.style.justifyContent = "flex-end";
        setTimeout(function(w){
            w.HTMLContent.style.display="none";
        },200,this);
    }
    /** 
    * Opens the window with animation
    * @return {null} - No return
    */
    open(){
        this.state = "OPEN";
        this.HTMLContent.style.display="flex";
        this.HTMLContent.style.opacity="1";
        this.HTML.style.justifyContent = "flex-start";
        // Little delay to let the display be processed and avoid jumping
        setTimeout(function(w){
            w.HTMLContent.style.maxWidth = w.referenceWidth+"px";
        },10,this);
    }
}


/**
* A fonctionnal button with state and signals
*/
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

        this.HTML.ob = this // To find back object in events callbacks
        this.HTML.addEventListener("click",this.clicked);
    }

    /** 
    * Called when the click event is fired
    * @param {Event} ev - Event fired
    * @return {null} Returns no value
    */
    clicked(ev){
        const self = ev.currentTarget.ob;
        self.switchState();
        if (self.callBackObTarget == null){
            self.callback(self);
        }else{
            self.callback.call(self.callBackObTarget,self);
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
                this.HTML.style.color = gameConfig.colors["debug"];
                this.HTML.style.borderColor = gameConfig.colors["debug"];
                this.HTML.style.cursor = "not-allowed";
                break;
        }
    }
}