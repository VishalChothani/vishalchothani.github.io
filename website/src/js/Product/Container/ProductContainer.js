import React, {Component} from 'react';
import ReactImageMagnify from 'react-image-magnify';
import './Product.scss';
import {connect} from 'react-redux';
import { ProductLoaded } from '../../Collection/Actions/CollectionAction';
import { bindActionCreators } from 'redux';

class ProductContainer extends Component{

  constructor(props){
    super(props);
    props.ProductLoaded(props.match.params.productId, props.womenData);
  }

  render(){
    const {
      productInfo,
    } = this.props;
    return(
      
      <section className="bootstrap-grid product-container">
        { productInfo && 
          <div className="container">
            <div className="row">
              <div className="col-xs-12 col-sm-offset-1 col-sm-10">
                <div className="row">
                  <div className="col-xs-12 col-sm-6">
                    <ReactImageMagnify {...{
                        smallImage: {
                          alt: productInfo.alt,
                          isFluidWidth: true,
                          src: productInfo.productImg,
                        },
                        largeImage: {
                          src: productInfo.productImgLarge,
                          width: 1200,
                          height: 1800
                        },
                        isHintEnabled: true,
                        shouldHideHintAfterFirstActivation: false
                      }} 
                    />
                  </div>
                  <div className="col-xs-12 col-sm-6 product-info margin-top">
                    <h2>{productInfo.title}</h2>
                    <h5 className="margin-v">{productInfo.desc}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </section>
      
    )
  }
}

const mapStateToProps = (state) => {
  console.log("State: ",state);
  return{
    productInfo: state.productInfo,
    womenData: state.womenData,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ProductLoaded:ProductLoaded}, dispatch);
}

export default connect(mapStateToProps,mapDispatchToProps)(ProductContainer);
