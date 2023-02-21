import React from 'react';
// import './grid.scss';
import "../../../assets/scss/_grid.scss"

export function Grid() {
  return (
    <>
      <h1>VARIANTS</h1>
      <hr />

      <h2>1: Auto Layout (mg-grid)</h2>

      <div class="mg-grid">

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

      </div>

      <h2>2: Specified Columns Layout - (example - a two-column grid: mg-grid__col-2)</h2>

      <div class="mg-grid mg-grid__col-2">

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div class="mg-grid__content">
          <h3 class="mg-grid__heading">UNDRR</h3>
          <p class="mg-grid__text">UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

      </div>
      
      <div class="mg-grid mg-grid__col-3">
      </div>

    </>

  );
}
