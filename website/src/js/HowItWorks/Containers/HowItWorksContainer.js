import React, {Component} from 'react';
import classNames from 'classnames';
import configurationService from '../../Common/ConfigurationService';
import { connect } from 'react-redux';
import HowItWorksComponent from '../Component/HowItWorksComponent';
import {CONSTANTS} from '../../Common/Constants';
import { Link } from 'react-router-dom';

class HowItWorksContainer extends Component{
  render(){
    const isInMobile = configurationService.isInMobile();
    const {
      howItWorksData,
    } = this.props;
    return(
      <section className={classNames('how-it-works margin-h', {'padding' : !isInMobile})}>
        <div className="h2 align-center margin-bot relative heading heading-black">How It Works</div>
        <div className="how-it-works-section padding-top">
          <HowItWorksComponent howItWorksData={howItWorksData} />
        </div>
        {/* TODO: Make a button component */}
        <div className="margin-v align-center">
          <Link to={"/"+CONSTANTS.pages.contact} id="how-to-contact" className="button h4"> Contact us Now</Link>
        </div>
      </section>
    )
  }
}

const mapStateToProps = (state) => {
  return{
    howItWorksData: state.howItWorksData,
  }
}

export default connect(mapStateToProps)(HowItWorksContainer);
