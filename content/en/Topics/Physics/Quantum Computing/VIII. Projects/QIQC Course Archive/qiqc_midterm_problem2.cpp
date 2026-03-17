#include <iostream>
#include <vector>
#include <cstdint>

using ull = unsigned long long;

//---------------------------------------------------------------------
// 1. Field-of-Fractions template class (for rational coefficients)
//---------------------------------------------------------------------
template <typename T>
class fieldOfFraction {
public:
    T a, b;  // fraction = a/b

    fieldOfFraction(T num, T den) : a(num), b(den) {
        normalize();
    }
    fieldOfFraction() : a(0), b(1) {}

    // integer part ⌊a/b⌋
    T integer_part() const {
        return a / b;
    }
    // remainder numerator a mod b
    T remainder_numer() const {
        return a % b;
    }

private:
    // greatest common divisor
    static T gcd(T u, T v) {
        if (u < 0) u = -u;
        if (v < 0) v = -v;
        while (v != 0) {
            T t = v;
            v = u % v;
            u = t;
        }
        return u;
    }

    // normalize so that gcd(a,b)=1 and b>0
    void normalize() {
        T g = gcd(a, b);
        if (g != 0) {
            a /= g;
            b /= g;
        }
        if (b < 0) {
            a = -a;
            b = -b;
        }
    }
};

//---------------------------------------------------------------------
// 2. Build convergents p_j/q_j from continued-fraction quotients
//---------------------------------------------------------------------
std::vector<std::pair<ull, ull>> build_convergents(const std::vector<ull>& qs) {
    std::vector<std::pair<ull, ull>> convs;
    // initial p[-2]=0, p[-1]=1; q[-2]=1, q[-1]=0
    ull p_im2 = 0, p_im1 = 1;
    ull q_im2 = 1, q_im1 = 0;

    for (ull ai : qs) {
        ull p_i = ai * p_im1 + p_im2;
        ull q_i = ai * q_im1 + q_im2;
        convs.emplace_back(p_i, q_i);
        p_im2 = p_im1;  p_im1 = p_i;
        q_im2 = q_im1;  q_im1 = q_i;
    }
    return convs;
}

int main() {
    // test cases (n, x)
    std::vector<std::pair<int, ull>> tests = {
        {8, 47},    // 47/256
        {6, 19},    // 19/64
        {10, 678}   // 678/1024
    };

    for (auto [n, x] : tests) {
        ull denom = 1ULL << n;
        std::vector<ull> quotients;

        // Continued-fraction expansion of x/2^n
        fieldOfFraction<ull> frac(x, denom);
        while (frac.b != 0) {
            ull q = frac.integer_part();
            quotients.push_back(q);
            ull r = frac.remainder_numer();
            if (r == 0) break;
            // invert the fractional part for next step
            frac = fieldOfFraction<ull>(frac.b, r);
        }

        // Build convergents from quotients
        auto convs = build_convergents(quotients);

        std::cout << "n=" << n << ", x=" << x
                  << ": x/2^n = " << double(x)/double(denom) << "\n";

        ull bound = 1ULL << (n/2);  // candidate order bound: r < 2^(n/2)
        std::cout << "Convergents (p_j/q_j):\n";
        for (auto [p, q] : convs) {
            std::cout << "  " << p << "/" << q;
            if (q <= bound) std::cout << "   <-- candidate order";
            std::cout << "\n";
        }
        std::cout << "\n";
    }

    return 0;
}