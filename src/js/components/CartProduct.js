import AmountWidget from './AmountWidget.js';
import {select} from '../settings.js';

class CartProduct {
  constructor(menuProduct, element) {

    const thisCartProduct = this;

    thisCartProduct.id = menuProduct.id;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.price = menuProduct.price;
    thisCartProduct.priceSingle = menuProduct.priceSingle;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

    thisCartProduct.getElements(element);


    thisCartProduct.initActions();
    thisCartProduct.initAmountWidget();

    //            console.log('new CartProduct: ', thisCartProduct);

  }
  getElements(element) {
    const thisCartProduct = this;

    thisCartProduct.dom = {};
    thisCartProduct.dom.wrapper = element;

    thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget);
    thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
    thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
    thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);


    //            console.log('cartProduct: ', thisCartProduct);
  }
  initAmountWidget() {
    const thisCartProduct = this;

    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

    thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
      thisCartProduct.amount = thisCartProduct.amountWidget.value;
      thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;

      thisCartProduct.dom.price.innerHTML = thisCartProduct.price;

    });
  }

  initActions() {
    const thisCartProduct = this;

    thisCartProduct.dom.edit.addEventListener('click', function (event) {
      event.preventDefault();

    });

    thisCartProduct.dom.remove.addEventListener('click', function (event) {
      event.preventDefault();
      thisCartProduct.remove();

    });

  }
  remove() {
    const thisCartProduct = this;

    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: thisCartProduct,
      },
    });

    thisCartProduct.dom.wrapper.dispatchEvent(event);

    console.log('remove: ', thisCartProduct);
  }

  getData() {
    const thisCartProduct = this;

    return {
      id: thisCartProduct.id,
      amount: thisCartProduct.amount,
      price: thisCartProduct.price,
      params: thisCartProduct.params,
      priceSingle: thisCartProduct.priceSingle,
      name: thisCartProduct.name,

    };
  }


}

export default CartProduct;