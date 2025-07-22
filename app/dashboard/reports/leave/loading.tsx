"use client";

import { Loader } from "@/components/loader"

const Loading = () => {
  return ( 
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <Loader />
    </div>
   );
}
 
export default Loading;

