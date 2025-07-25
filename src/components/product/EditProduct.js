class EditProduct {
  constructor() {
    this.name = 'EditProduct';
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = '<div>EditProduct Component</div>';
    return element;
  }
}

export default EditProduct;