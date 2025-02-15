// Custom Components

class DiceObject extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById('dice-object');
    const templateContent = template.content;
    this.appendChild(templateContent.cloneNode(true));
    let sides = this.getAttribute('sides');
    this.innerHTML += `
      <div class="die">
        <div class="value">${sides}</div>
        <svg viewBox="0 0 33 33">
            <use xlink:href="#d${sides}"></use>
        </svg>
      </div>
    `;
  }
}

customElements.define('dice-object', DiceObject);

class DiceIcon extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById('dice-icon');
    const templateContent = template.content;
    this.appendChild(templateContent.cloneNode(true));
    let sides = this.getAttribute('sides');
    this.innerHTML += `
      <div class="icon">${sides}
        <svg viewBox="0 0 12 12">
            <use xlink:href="#d${sides}-icon"></use>
        </svg>
      </div>
    `;
  }
  
  connectedCallback() {
    this.querySelector('.increment').addEventListener('click', function(e) {
      let sides = e.target.parentElement.getAttribute('sides');
      
      // add corresponding dice
      let dice = `<dice-object sides="${sides}"></dice-object>`;
      document.getElementById('table-top').insertAdjacentHTML('beforeend', dice);
      
      // enable decrement
      e.target.parentElement.querySelector('.decrement').removeAttribute('disabled');
      
      // enable roll
      document.getElementById('roll').removeAttribute('disabled');
    });
    
    this.querySelector('.decrement').addEventListener('click', function(e) {
      let sides = e.target.parentElement.getAttribute('sides');
      
      // remove corresponding dice
      let correspondingDice = document.querySelectorAll(`dice-object[sides="${sides}"]`);
      correspondingDice[0].remove();
      
      // disable decrement if no more
      if (correspondingDice.length === 1) {
        e.target.setAttribute('disabled', '');
      }
      
      // disable roll if no more
      let dice = document.querySelectorAll('dice-object');
      if (dice.length < 1) {
        document.getElementById('roll').setAttribute('disabled', '');
      }
    });
  }
}

customElements.define('dice-icon', DiceIcon);


// Roll the dice

document.getElementById('roll').addEventListener('click', function() {
  let dice = document.querySelectorAll('dice-object');
  
  dice.forEach((die) => {
    let sides = die.getAttribute('sides');
    let roll = Math.floor(Math.random() * sides + 1);
    die.querySelector('.value').innerText = roll;
  });
});