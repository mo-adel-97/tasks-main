import { printWhenReady } from './printReady';

test('printing waits for fonts and image completion',async()=>{
  let fontsReady, imageReady;
  const target={focus:jest.fn(),print:jest.fn(),document:{
    fonts:{ready:new Promise(resolve=>{fontsReady=resolve;})},
    images:[{complete:false,addEventListener:(event,callback)=>{if(event==='load')imageReady=callback;}}]
  }};
  const pending=printWhenReady(target);
  expect(target.print).not.toHaveBeenCalled();
  fontsReady();await Promise.resolve();
  expect(target.print).not.toHaveBeenCalled();
  imageReady();await pending;
  expect(target.print).toHaveBeenCalledTimes(1);
});
