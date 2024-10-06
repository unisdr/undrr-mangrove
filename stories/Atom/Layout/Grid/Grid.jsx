import React from 'react';

export function Grid() {
  return (
    <>
      <h2>Auto Layout (mg-grid)</h2>

      <div className="mg-grid" style={{ border: '1px dashed #aaa' }}>

        <div style={{ border: '1px dashed #aaa' }}>
          <h3>UNDRR</h3>
          <p>UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div style={{ border: '1px dashed #aaa' }}>
          <h3>UNDRR</h3>
          <p>UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div style={{ border: '1px dashed #aaa' }}>
          <h3>UNDRR</h3>
          <p>UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div style={{ border: '1px dashed #aaa' }}>
          <h3>UNDRR</h3>
          <p>UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

      </div>

      <h2>Specified columns layout</h2>
      <p>example with a two-column grid: mg-grid__col-2</p>

      <div className="mg-grid mg-grid__col-2" style={{ border: '1px dashed #aaa' }}>

        <div style={{ border: '1px dashed #aaa' }}>
          <h3>UNDRR</h3>
          <p>UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div style={{ border: '1px dashed #aaa' }}>
          <h3>UNDRR</h3>
          <p>UNDRR convenes partners and coordinates activities to create safer, more resilient communities.</p>
        </div>

        <div className=" mg-grid__col--span-2" style={{ border: '1px dashed #aaa' }}>
          <h3>mg-grid__col--span-2</h3>
          <p>I use .mg-grid__col--span-2 to span 2 cols!</p>
        </div>

      </div>

      <div className="mg-grid mg-grid__col-3" style={{ border: '1px dashed #aaa' }}>
      </div>

    </>
  );
}
