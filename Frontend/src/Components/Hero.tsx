export default function Hero() {
  return (
    <div className="text-center mb-20 animate-fade-in">
      <div className="relative inline-block">
        <div className="absolute -inset-8 bg-linear-to-r from-blue-400/15 via-pink-400/15 to-blue-400/15 blur-3xl opacity-60 animate-gradient-x" />
        <div className="absolute -inset-4 bg-linear-to-b from-transparent via-blue-100/20 to-transparent blur-2xl" />
        <h1 className="relative inline-block font-bold tracking-wider antialiased text-8xl sm:text-9xl">
          <span
            className="inline-block hover:scale-[1.25] hover:-rotate-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 animate-bounce-in transition-all duration-500 ease-out cursor-pointer hover:brightness-125"
            style={{
              animationDelay: "0.1s",
              filter:
                "drop-shadow(rgba(168, 85, 247, 0.4) 0px 10px 20px) drop-shadow(rgba(236, 72, 153, 0.3) 0px 0px 30px)",
            }}
          >
            F
          </span>
          <span
            className="inline-block hover:scale-[1.25] hover:rotate-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 animate-bounce-in transition-all duration-500 ease-out cursor-pointer hover:brightness-125"
            style={{
              animationDelay: "0.2s",
              filter:
                "drop-shadow(rgba(236, 72, 153, 0.4) 0px 10px 20px) drop-shadow(rgba(244, 63, 94, 0.3) 0px 0px 30px)",
            }}
          >
            i
          </span>
          <span
            className="inline-block hover:scale-[1.25] hover:-rotate-6 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 animate-bounce-in transition-all duration-500 ease-out cursor-pointer hover:brightness-125"
            style={{
              animationDelay: "0.3s",
              filter:
                "drop-shadow(rgba(244, 63, 94, 0.4) 0px 10px 20px) drop-shadow(rgba(249, 115, 22, 0.3) 0px 0px 30px)",
            }}
          >
            n
          </span>
          <span
            className="inline-block hover:scale-[1.25] hover:rotate-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 animate-bounce-in transition-all duration-500 ease-out cursor-pointer hover:brightness-125"
            style={{
              animationDelay: "0.4s",
              filter:
                "drop-shadow(rgba(249, 115, 22, 0.4) 0px 10px 20px) drop-shadow(rgba(245, 158, 11, 0.3) 0px 0px 30px)",
            }}
          >
            d
          </span>
          <span
            className="inline-block hover:scale-[1.25] hover:-rotate-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 animate-bounce-in transition-all duration-500 ease-out cursor-pointer hover:brightness-125"
            style={{
              animationDelay: "0.5s",
              filter:
                "drop-shadow(rgba(245, 158, 11, 0.4) 0px 10px 20px) drop-shadow(rgba(234, 179, 8, 0.3) 0px 0px 30px)",
            }}
          >
            i
          </span>
          <span
            className="inline-block hover:scale-[1.25] hover:rotate-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-lime-500 to-yellow-500 animate-bounce-in transition-all duration-500 ease-out cursor-pointer hover:brightness-125"
            style={{
              animationDelay: "0.6s",
              filter:
                "drop-shadow(rgba(234, 179, 8, 0.4) 0px 10px 20px) drop-shadow(rgba(132, 204, 22, 0.3) 0px 0px 30px)",
            }}
          >
            t
          </span>
        </h1>
      </div>
    </div>
  );
}
