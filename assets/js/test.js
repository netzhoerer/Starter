class Test {
  constructor() {
    this.text = 'hello';
  }

  static clickListener(event) {
    event.target.classList.toggle('blub');
    // console.log(event);
  }

  init() {
    const elements = document.querySelectorAll('strong');
    [...elements].forEach((element) => {
      element.addEventListener('click', this.constructor.clickListener);
    });
  }
}

const myTest = new Test();
myTest.init();
